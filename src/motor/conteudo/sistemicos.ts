/**
 * Situações disparadas pelo estado da vida.
 *
 * Nada aqui é sorteado do nada: um pedido de namoro só existe se há alguém
 * com quem se está saindo há meses; a pergunta sobre o nome do bebê só
 * existe porque um bebê nasceu.
 */

import type { Conteudo, Ctx } from './base';
import * as P from './papeis';
import { dinheiro, envolvimento, estresse, fato, feliz, prox, tensao } from './efeitos';
import { idadePessoa, marcarFato, temFato } from '../nucleo';
import { mudarEstagio, terminar } from '../sistemas/romance';
import { morarJuntos } from '../sistemas/moradia';
import { registrarNascimento } from '../sistemas/familia';
import { fazerEnem, largarEscola, podeFazerEnem, temEscolaridade } from '../sistemas/escola';
import { aposentar, podeAposentar } from '../sistemas/trabalho';
import { criarRng } from '../rng';
import { sortearNome } from '../dados/nomes';
import { anoDe } from '../tempo';
import { descricaoOrigem } from '../sistemas/social';
import { ROTINAS } from '../sistemas/rotinas';
import { economiaLocal } from '../dados/lugares';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Nomes sugeridos para o bebê — estáveis para o mesmo bebê (não mudam ao recarregar). */
export function nomesParaBebe(c: Ctx): string[] {
  const b = c.p.bebe;
  const r = criarRng(hash(b.id + c.v.id));
  const g = b.genero === 'feminino' ? 'feminino' : 'masculino';
  const nomes: string[] = [];
  for (let k = 0; k < 30 && nomes.length < 3; k++) {
    const n = sortearNome(r, g, anoDe(b.tNasc));
    if (!nomes.includes(n)) nomes.push(n);
  }
  return nomes;
}

const mesesNoEstagio = (c: Ctx, papel: string) => c.v.t - (c.v.vinculos[c.p[papel].id].romance?.tEstagio ?? c.v.t);
const envolv = (c: Ctx, papel: string) => c.v.vinculos[c.p[papel].id].romance?.envolvimento ?? 0;

export const SISTEMICOS: Conteudo[] = [
  /* ============================================================= ROMANCE */
  {
    id: 'rom_alguem_especial', tipo: 'decisao', idade: [13, 90], tema: 'amor', prioritario: true, repetir: 0,
    papeis: { pessoa: P.interesse },
    quando: c => c.v.vinculos[c.p.pessoa.id].romance?.tEstagio === c.v.t,
    titulo: 'Alguém especial',
    texto: c => {
      const onde = descricaoOrigem(c.v, c.v.vinculos[c.p.pessoa.id]);
      const ja = P.parceiro(c.v)[0];
      return ja
        ? `Você namora ${ja.nome}. Mesmo assim, ${c.p.pessoa.nome}, que você conhece ${onde}, não sai da sua cabeça há semanas.`
        : `${c.p.pessoa.nome}, que você conhece ${onde}, tem ocupado seus pensamentos mais do que deveria. Quando ${c.p.pessoa.genero === 'feminino' ? 'ela' : c.p.pessoa.genero === 'masculino' ? 'ele' : 'elu'} ri, você repara.`;
    },
    opcoes: [
      {
        id: 'chamar', texto: c => (c.idade < 18 ? `Chamar ${c.p.pessoa.nome} para sair depois da aula` : `Chamar ${c.p.pessoa.nome} para sair`),
        disponivel: c => (P.parceiro(c.v).length > 0 ? false : true),
        comportamento: { coragem: 1 },
        resolver: c => {
          if (!c.v.eu.atracao) c.v.eu.atracao = c.p.pessoa.genero === 'masculino' ? 'homens' : c.p.pessoa.genero === 'feminino' ? 'mulheres' : 'ambos';
          const vin = c.v.vinculos[c.p.pessoa.id];
          const topou = envolv(c, 'pessoa') + (c.r.next() - 0.5) * 30 >= 42;
          if (!topou) {
            vin.romance = undefined;
            return { texto: `${c.p.pessoa.nome} sorriu sem graça e disse que gostava de você "como amig${c.g('o', 'a', 'e')}".`, memoria: `Chamou ${c.p.pessoa.nome} para sair e levou um não educado.`, tom: 'ruim', efeito: () => feliz(c, -4) };
          }
          mudarEstagio(c.v, vin, 'saindo');
          return { texto: `${c.p.pessoa.nome} topou. ${c.idade < 18 ? 'Foram ao shopping e dividiram uma batata frita.' : 'O primeiro encontro terminou tarde.'}`, memoria: `Começou a sair com ${c.p.pessoa.nome}.`, tom: 'bom', efeito: () => feliz(c, 6), lembrar: ['pessoa', 'Começaram a sair.'] };
        }
      },
      {
        id: 'trair', texto: c => `Arriscar algo com ${c.p.pessoa.nome}, escondido`,
        disponivel: c => (P.parceiro(c.v).length > 0 ? true : false),
        comportamento: { impulsividade: 2, empatia: -1 },
        resolver: c => {
          const atual = P.parceiro(c.v)[0];
          const vinAtual = c.v.vinculos[atual.id];
          c.v.vinculos[c.p.pessoa.id].romance = undefined;
          if (c.r.chance(0.45)) {
            vinAtual.tensao = 95;
            return { texto: `Aconteceu — e ${atual.nome} descobriu por uma mensagem.`, memoria: `Traiu ${atual.nome} com ${c.p.pessoa.nome}, e ${atual.nome} descobriu.`, tom: 'ruim', relevancia: 'marco', efeito: () => estresse(c, 15) };
          }
          return { texto: 'Aconteceu uma vez. Ninguém ficou sabendo. Você sabe.', memoria: null, efeito: () => estresse(c, 8) };
        }
      },
      {
        id: 'guardar', texto: 'Guardar isso para si', resolver: c => {
          c.v.vinculos[c.p.pessoa.id].romance = undefined;
          return { texto: 'O que você sente ficou só com você. Com o tempo, passou.', memoria: null };
        }
      }
    ]
  },
  {
    id: 'rom_pedido_namoro', tipo: 'decisao', idade: [14, 90], tema: 'amor', prioritario: true, repetir: 1,
    papeis: { pessoa: P.saindoCom },
    quando: c => mesesNoEstagio(c, 'pessoa') >= 6 && envolv(c, 'pessoa') >= 55,
    titulo: 'É sério?',
    texto: c => `Faz meses que você e ${c.p.pessoa.nome} saem juntos. Hoje, meio sem jeito, ${c.p.pessoa.genero === 'feminino' ? 'ela' : 'ele'} perguntou se vocês estão namorando.`,
    opcoes: [
      { id: 'sim', texto: 'Dizer que sim', resolver: c => ({ texto: `Agora é oficial. ${c.p.pessoa.nome} mudou o status no mesmo dia.`, memoria: `Começou a namorar ${c.p.pessoa.nome}.`, relevancia: 'marco', tom: 'bom', efeito: () => { mudarEstagio(c.v, c.v.vinculos[c.p.pessoa.id], 'namoro'); envolvimento(c, 'pessoa', 8); feliz(c, 8); }, lembrar: ['pessoa', 'Começaram a namorar.'] }) },
      { id: 'calma', texto: 'Pedir mais tempo', resolver: c => ({ texto: `${c.p.pessoa.nome} disse que entendia. Pareceu entender menos do que disse.`, memoria: null, efeito: () => envolvimento(c, 'pessoa', -10) }) },
      { id: 'terminar', texto: 'Admitir que não quer nada sério', comportamento: { independencia: 1 },
        resolver: c => ({ texto: `Vocês pararam de se ver. ${c.p.pessoa.nome} apagou as fotos.`, memoria: `Terminou com ${c.p.pessoa.nome} quando a coisa começou a ficar séria.`, efeito: () => { mudarEstagio(c.v, c.v.vinculos[c.p.pessoa.id], 'ex'); } }) }
    ]
  },
  {
    id: 'rom_morar_junto', tipo: 'decisao', idade: [19, 90], tema: 'amor', prioritario: true, repetir: 2,
    papeis: { pessoa: P.namorado },
    quando: c => mesesNoEstagio(c, 'pessoa') >= 18 && envolv(c, 'pessoa') >= 62 && idadePessoa(c.v, c.p.pessoa) >= 19,
    titulo: 'Uma casa só',
    texto: c => `${c.p.pessoa.nome} fez as contas no guardanapo: juntos, o aluguel pesa menos e o fim de semana dura mais. Quer morar com você.`,
    opcoes: [
      { id: 'sim', texto: 'Morar junto', comportamento: { familia: 1 },
        resolver: c => ({ texto: `A mudança coube numa tarde. A primeira noite foi num colchão no chão da casa nova.`, memoria: `Foi morar junto com ${c.p.pessoa.nome}.`, relevancia: 'marco', tom: 'bom', efeito: () => { mudarEstagio(c.v, c.v.vinculos[c.p.pessoa.id], 'morando_junto'); morarJuntos(c.v, c.p.pessoa); envolvimento(c, 'pessoa', 8); }, lembrar: ['pessoa', 'Foram morar juntos.'] }) },
      { id: 'ainda_nao', texto: 'Ainda não', comportamento: { independencia: 1 },
        resolver: c => ({ texto: `${c.p.pessoa.nome} guardou o guardanapo. Não tocou mais no assunto.`, memoria: null, efeito: () => envolvimento(c, 'pessoa', -8) }) }
    ]
  },
  {
    id: 'rom_pedido_casamento', tipo: 'decisao', idade: [20, 90], tema: 'amor', prioritario: true, repetir: 3,
    papeis: { pessoa: P.parceiro },
    quando: c => {
      const rom = c.v.vinculos[c.p.pessoa.id].romance!;
      return rom.estagio !== 'casamento' && c.v.t - c.v.vinculos[c.p.pessoa.id].tInicio >= 30 && rom.envolvimento >= 70 && !temFato(c.v, `noivado_${c.p.pessoa.id}`);
    },
    titulo: 'O pedido',
    texto: c => `No meio de um jantar comum, ${c.p.pessoa.nome} ficou em silêncio, tirou uma caixinha do bolso e perguntou se você quer casar.`,
    opcoes: [
      { id: 'sim', texto: 'Sim', comportamento: { familia: 1 },
        resolver: c => ({ texto: 'Sim. O resto da noite foi ligação para a família.', memoria: `Ficou noiv${c.g('o', 'a', 'e')} de ${c.p.pessoa.nome}.`, relevancia: 'marco', tom: 'bom', efeito: () => { marcarFato(c.v, `noivado_${c.p.pessoa.id}`); envolvimento(c, 'pessoa', 10); feliz(c, 10); } }) },
      { id: 'nao_agora', texto: 'Dizer que ainda não é a hora', resolver: c => ({ texto: `${c.p.pessoa.nome} guardou a caixinha. A noite acabou cedo.`, memoria: `Recusou o pedido de casamento de ${c.p.pessoa.nome}.`, tom: 'ruim', efeito: () => { envolvimento(c, 'pessoa', -18); tensao(c, 'pessoa', 20); } }) }
    ]
  },
  {
    id: 'rom_casamento', tipo: 'decisao', idade: [18, 95], tema: 'amor', prioritario: true, prioridade: 5, repetir: 0,
    papeis: { pessoa: P.parceiro },
    quando: c => temFato(c.v, `noivado_${c.p.pessoa.id}`) && c.v.vinculos[c.p.pessoa.id].romance?.estagio !== 'casamento' && c.v.t - (c.v.fatos[`noivado_${c.p.pessoa.id}`] ?? c.v.t) >= 12,
    titulo: 'Como vai ser o casamento',
    texto: c => `A data está marcada. Falta decidir o tamanho da festa — e de onde vem o dinheiro. Você tem ${c.v.financas.conta > 0 ? `R$ ${Math.round(c.v.financas.conta).toLocaleString('pt-BR')} na conta` : 'pouco dinheiro guardado'}.`,
    opcoes: [
      { id: 'cartorio', texto: 'Só o cartório e um almoço com os mais próximos', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Assinaram no cartório de manhã. O almoço foi na casa de um parente, com churrasco.', memoria: `Casou-se com ${c.p.pessoa.nome} no cartório, com almoço para os mais próximos.`, relevancia: 'marco', tom: 'bom', efeito: () => casar(c, 2500) }) },
      { id: 'festa', texto: 'Festa num salão, para uns cem convidados', resolver: c => ({ texto: 'Teve DJ, bolo de três andares e tio dançando até o fim.', memoria: `Casou-se com ${c.p.pessoa.nome} numa festa para cem convidados.`, relevancia: 'marco', tom: 'bom', efeito: () => casar(c, Math.round(28000 * economiaLocal(c.v.moradia.municipioId).custo)) }) },
      { id: 'festao', texto: 'O casamento dos sonhos, nem que seja parcelado', comportamento: { impulsividade: 1 },
        resolver: c => ({ texto: 'Igreja cheia, trezentos convidados, fotos lindas — e um carnê de doze vezes.', memoria: `Casou-se com ${c.p.pessoa.nome} numa festa de trezentos convidados.`, relevancia: 'marco', tom: 'bom', efeito: () => casar(c, Math.round(75000 * economiaLocal(c.v.moradia.municipioId).custo)) }) }
    ]
  },
  {
    id: 'rom_crise', tipo: 'decisao', idade: [16, 90], tema: 'amor', prioritario: true, repetir: 3,
    papeis: { pessoa: P.parceiro },
    quando: c => c.v.vinculos[c.p.pessoa.id].tensao >= 45 || envolv(c, 'pessoa') < 35,
    titulo: 'A conversa',
    texto: c => `As brigas com ${c.p.pessoa.nome} viraram rotina${c.v.financas.negativado ? ', quase sempre sobre dinheiro' : ''}. Hoje ${c.p.pessoa.genero === 'feminino' ? 'ela' : 'ele'} disse que não aguenta mais do jeito que está.`,
    opcoes: [
      { id: 'terapia', texto: 'Propor terapia de casal', disponivel: c => (c.v.financas.conta > 2000 ? true : 'Sem dinheiro para terapia de casal agora.'), comportamento: { empatia: 1, familia: 1 },
        resolver: c => ({ texto: 'Foram meses de sessões difíceis. Algumas coisas melhoraram.', memoria: `Fez terapia de casal com ${c.p.pessoa.nome}.`, efeito: () => { dinheiro(c, -2400); tensao(c, 'pessoa', -35); envolvimento(c, 'pessoa', 12); } }) },
      { id: 'ouvir', texto: 'Ouvir, sem se defender', comportamento: { empatia: 2 },
        resolver: c => ({ texto: `Você ouviu tudo. ${c.p.pessoa.nome} chorou, e depois vocês conversaram até de madrugada.`, memoria: null, efeito: () => { tensao(c, 'pessoa', -20); envolvimento(c, 'pessoa', 8); } }) },
      { id: 'rebater', texto: 'Rebater cada acusação', comportamento: { impulsividade: 1, empatia: -1 },
        resolver: c => ({ texto: 'A briga acabou com uma porta batida.', memoria: null, efeito: () => { tensao(c, 'pessoa', 20); envolvimento(c, 'pessoa', -10); } }) },
      { id: 'terminar', texto: 'Terminar', comportamento: { independencia: 1 },
        resolver: c => ({ texto: `Acabou. ${c.p.pessoa.nome} não tentou convencer ninguém do contrário.`, memoria: null, efeito: () => terminar(c.v, c.p.pessoa, c.v.vinculos[c.p.pessoa.id], 'jogador') }) }
    ]
  },

  /* ============================================================== FILHOS */
  {
    id: 'fam_nome_bebe', tipo: 'decisao', idade: [12, 70], tema: 'filhos', prioritario: true, prioridade: 10, biografica: true, repetir: 0,
    papeis: { bebe: P.bebeSemNome },
    titulo: c => (c.p.bebe.genero === 'feminino' ? 'Uma menina' : 'Um menino'),
    texto: c => {
      const outro = P.parceiro(c.v)[0];
      return `${c.p.bebe.genero === 'feminino' ? 'Ela' : 'Ele'} nasceu com ${c.r.int(46, 52)} centímetros e um choro que encheu o corredor da maternidade.${outro ? ` ${outro.nome} tem uma lista de nomes; você tem outra.` : ''} Como vai se chamar?`;
    },
    opcoes: [0, 1, 2].map(i => ({
      id: `nome${i}`,
      texto: (c: Ctx) => nomesParaBebe(c)[i] ?? 'Maria',
      resolver: (c: Ctx) => {
        const nome = nomesParaBebe(c)[i] ?? 'Maria';
        return { texto: `${nome}.`, memoria: null, efeito: () => registrarNascimento(c.v, c.p.bebe, nome) };
      }
    }))
  },
  {
    id: 'fam_gravidez_surpresa', tipo: 'decisao', idade: [14, 50], tema: 'filhos', prioritario: true, prioridade: 6, repetir: 1,
    quando: c => c.v.processos.some(p => p.tipo === 'gestacao' && p.descoberta && !p.planejada && c.v.fatos[`gravidez_descoberta_${p.id}`] === c.v.t),
    titulo: 'Fora dos planos',
    texto: c => c.idade < 20
      ? `Você tem ${c.idade} anos e um teste de farmácia com dois tracinhos na mão${c.v.corpo.podeGestar ? '' : ' — de outra pessoa'}. Ninguém em casa sabe ainda.`
      : 'O teste deu positivo. As contas do mês, o espaço da casa, o trabalho — tudo mudou de tamanho numa tarde.',
    opcoes: [
      { id: 'contar', texto: c => (c.idade < 20 ? 'Contar para a família de uma vez' : 'Sentar e refazer os planos juntos'), comportamento: { coragem: 1, familia: 1 },
        resolver: c => ({ texto: c.idade < 20 ? 'Teve choro, sermão e silêncio. Depois, alguém começou a separar roupas de bebê que estavam guardadas.' : 'Vocês passaram a noite fazendo contas. De manhã, riram de nervoso.', memoria: c.idade < 20 ? 'Contou para a família da gravidez inesperada.' : null, efeito: () => { estresse(c, 8); for (const p of P.genitor(c.v)) { const vin = c.v.vinculos[p.id]; vin.tensao = Math.min(100, vin.tensao + 15); } } }) },
      { id: 'esconder', texto: 'Esconder enquanto der', comportamento: { impulsividade: 1 },
        resolver: c => ({ texto: 'Deu para esconder três meses. Quando a barriga apareceu, a conversa foi pior.', memoria: null, efeito: () => { estresse(c, 14); for (const p of P.genitor(c.v)) tensaoPessoa(c, p.id, 25); } }) }
    ]
  },
  {
    id: 'fam_filho_adolescente', tipo: 'decisao', idade: [30, 75], tema: 'filhos', repetir: 3,
    papeis: { filho: P.filhoEmCasa(13, 17) },
    titulo: c => `${c.p.filho.nome}, ${idadePessoa(c.v, c.p.filho)} anos`,
    texto: c => `${c.p.filho.nome} chegou em casa às três da manhã, sem avisar, com o celular desligado. Você passou a noite acordad${c.g('o', 'a', 'e')}.`,
    opcoes: [
      { id: 'castigo', texto: 'Castigo: sem celular e sem sair por um mês', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: `${c.p.filho.nome} cumpriu o castigo em silêncio absoluto.`, memoria: null, efeito: () => { prox(c, 'filho', -5); tensao(c, 'filho', 15); } }) },
      { id: 'conversar', texto: 'Esperar a raiva passar e conversar', comportamento: { empatia: 1 },
        resolver: c => ({ texto: `No dia seguinte, ${c.p.filho.nome} contou que tinha brigado com ${c.p.filho.genero === 'feminino' ? 'a' : 'o'} melhor amig${c.p.filho.genero === 'feminino' ? 'a' : 'o'} e não queria voltar para casa.`, memoria: null, efeito: () => { prox(c, 'filho', 6); tensao(c, 'filho', -10); } }) },
      { id: 'gritar', texto: 'Gritar na porta', comportamento: { impulsividade: 1 },
        resolver: c => ({ texto: 'Os vizinhos ouviram. ${nome} bateu a porta do quarto.'.replace('${nome}', c.p.filho.nome), memoria: null, efeito: () => { prox(c, 'filho', -8); tensao(c, 'filho', 25); } }) }
    ]
  },
  {
    id: 'fam_filhos_escola', tipo: 'decisao', idade: [20, 70], tema: 'filhos',
    papeis: { filho: P.filhoEmCasa(2, 5) },
    quando: c => !temFato(c.v, 'filhos_escola_decidida'),
    titulo: 'Escola',
    texto: c => `${c.p.filho.nome} vai começar na escola. A escola pública do bairro é de graça; a particular mais próxima custa perto de R$ ${Math.round(1300 * economiaLocal(c.v.moradia.municipioId).custo).toLocaleString('pt-BR')} por mês, por filho.`,
    opcoes: [
      { id: 'publica', texto: 'Escola pública', resolver: c => ({ texto: `${c.p.filho.nome} foi para a escola municipal.`, memoria: null, efeito: () => fato(c, 'filhos_escola_decidida') }) },
      { id: 'privada', texto: 'Escola particular', resolver: c => ({ texto: `${c.p.filho.nome} foi para uma escola particular.`, memoria: `Colocou ${c.p.filho.nome} numa escola particular.`, efeito: () => { fato(c, 'filhos_escola_decidida'); fato(c, 'filhos_escola_privada'); } }) }
    ]
  },

  /* ======================================================= ESCOLA E FUTURO */
  {
    id: 'esc_fim_do_medio', tipo: 'decisao', idade: [16, 20], tema: 'estudo', garantido: true, biografica: true,
    quando: c => temFato(c.v, 'concluiu_medio') && c.v.fatos['concluiu_medio'] === c.v.t,
    titulo: 'E agora?',
    texto: c => `O ensino médio acabou. ${P.genitor(c.v)[0] ? `${P.genitor(c.v)[0].nome} quer saber o que você vai fazer. ` : ''}Os colegas se dividem entre ENEM, emprego e não saber.`,
    opcoes: [
      { id: 'enem', texto: 'Fazer o ENEM e tentar uma faculdade', resolver: c => {
        const pode = podeFazerEnem(c.v).grau === 'permitido';
        return { texto: pode ? 'A inscrição foi feita. A prova é em novembro.' : 'Você se prepara para tentar uma faculdade.', memoria: null, efeito: () => { fato(c, 'plano_faculdade'); if (pode) fazerEnem(c.v, c.r); } };
      } },
      { id: 'cursinho', texto: 'Um ano de cursinho antes de tentar', resolver: c => ({ texto: 'Um ano de cursinho: manhã de aula, tarde de exercício.', memoria: 'Decidiu passar um ano no cursinho antes de tentar o ENEM.', efeito: () => { fato(c, 'plano_faculdade'); if (!c.v.rotinas.some(r => r.id === 'cursinho')) c.v.rotinas.push({ id: 'cursinho', tInicio: c.v.t }); } }) },
      { id: 'trabalhar', texto: 'Arrumar um emprego', resolver: c => ({ texto: 'Você começou a mandar currículo.', memoria: 'Terminou o médio decidid' + c.g('o', 'a', 'e') + ' a trabalhar.', efeito: () => fato(c, 'plano_trabalho') }) },
      { id: 'tecnico', texto: 'Fazer um curso técnico', resolver: c => ({ texto: 'Você foi pesquisar os cursos técnicos da cidade.', memoria: null, efeito: () => fato(c, 'plano_tecnico') }) }
    ]
  },
  {
    id: 'esc_largar', tipo: 'decisao', idade: [15, 17], tema: 'escola', repetir: 1,
    quando: c => !!c.v.educacao.basica && (c.v.educacao.basica.reprovacoes >= 2 || (['vulneravel'].includes(c.v.origem.classe) && c.v.educacao.basica.desempenho < 45) || (!!c.v.trabalho.atual && c.v.trabalho.atual.carga === 'integral')),
    titulo: 'A escola ou o resto',
    texto: c => c.v.trabalho.atual
      ? 'O trabalho ocupa o dia; a escola, a noite. Você chega na aula dormindo, e a matéria não entra.'
      : c.v.educacao.basica!.reprovacoes >= 2
        ? 'Você é o mais velho da sala. Os professores já não esperam muito, e você também não.'.replace('o mais velho', c.g('o mais velho', 'a mais velha', 'e mais velhe'))
        : 'Em casa falta dinheiro, e um conhecido ofereceu trabalho o dia inteiro numa loja. Seria preciso largar a escola.',
    opcoes: [
      { id: 'ficar', texto: 'Continuar na escola', comportamento: { disciplina: 2 },
        resolver: c => ({ texto: 'Você continuou. Não ficou mais fácil, mas você continuou.', memoria: null, efeito: () => estresse(c, 5) }) },
      { id: 'largar', texto: 'Largar a escola', comportamento: { impulsividade: 1, independencia: 1 },
        resolver: c => ({ texto: 'Você parou de ir. A escola mandou uma carta; ninguém respondeu.', memoria: null, tom: 'ruim', efeito: () => largarEscola(c.v) }) }
    ]
  },

  /* ============================================================ TRABALHO */
  {
    id: 'trab_aposentar', tipo: 'decisao', idade: [60, 90], tema: 'trabalho', prioritario: true,
    quando: c => podeAposentar(c.v).grau === 'permitido' && !!c.v.trabalho.atual,
    titulo: 'A carta do INSS',
    texto: c => `O INSS confirmou: você já pode se aposentar. Seguir trabalhando é possível — ${c.v.trabalho.atual ? 'o trabalho continua lá' : 'se houver trabalho'}.`,
    opcoes: [
      { id: 'aposentar', texto: 'Aposentar', resolver: c => ({ texto: 'Na última sexta-feira, teve bolo na firma e discurso curto.', memoria: null, efeito: () => aposentar(c.v) }) },
      { id: 'seguir', texto: 'Continuar trabalhando mais um tempo', comportamento: { disciplina: 1 }, resolver: () => ({ texto: 'Você pediu o benefício para depois. Segunda-feira, trabalho como sempre.', memoria: null }) }
    ]
  },

  /* ============================================================== FAMÍLIA */
  {
    id: 'fam_pais_idosos', tipo: 'decisao', idade: [30, 80], tema: 'familia', prioritario: true, repetir: 8,
    papeis: { pai: P.genitor },
    quando: c => idadePessoa(c.v, c.p.pai) >= 72 && c.p.pai.saude < 45 && !c.p.pai.parceiroId && !c.v.vinculos[c.p.pai.id].convivio.includes('casa'),
    titulo: c => `${c.p.pai.nome}`,
    texto: c => `${c.p.pai.nome} caiu em casa e passou a noite no chão até alguém chegar. O médico foi claro: não dá mais para morar sozinh${c.p.pai.genero === 'feminino' ? 'a' : 'o'}.`,
    opcoes: [
      { id: 'trazer', texto: 'Trazer para morar com você', disponivel: c => (c.v.moradia.tipo === 'pais' ? false : true), comportamento: { familia: 2, generosidade: 1 },
        resolver: c => ({ texto: `${c.p.pai.nome} veio com duas malas e uma caixa de fotografias.`, memoria: `Levou ${c.p.pai.nome} para morar junto na velhice.`, relevancia: 'marco', efeito: () => { const vin = c.v.vinculos[c.p.pai.id]; if (!vin.convivio.includes('casa')) vin.convivio.push('casa'); c.p.pai.municipioId = c.v.moradia.municipioId; prox(c, 'pai', 12); estresse(c, 10); for (const par of P.conjuge(c.v)) tensaoPessoa(c, par.id, 15); } }) },
      { id: 'cuidadora', texto: 'Pagar uma cuidadora', comportamento: { familia: 1 },
        resolver: c => ({ texto: 'Uma cuidadora passou a dormir lá. O custo entrou no orçamento de todo mês.', memoria: `Contratou uma cuidadora para ${c.p.pai.nome}.`, efeito: () => { fato(c, `paga_cuidadora_${c.p.pai.id}`); prox(c, 'pai', 4); } }) },
      { id: 'irmaos', texto: 'Dividir a responsabilidade com os irmãos', disponivel: c => (P.irmao(c.v).length > 0 ? true : 'Você não tem irmãos para dividir.'),
        resolver: c => ({ texto: 'Fizeram uma escala. Nem sempre ela foi cumprida.', memoria: null, efeito: () => { for (const i of P.irmao(c.v)) tensaoPessoa(c, i.id, 10); } }) },
      { id: 'asilo', texto: 'Procurar uma casa de repouso', comportamento: { familia: -1 },
        resolver: c => ({ texto: `${c.p.pai.nome} não disse nada no dia da mudança.`, memoria: `Levou ${c.p.pai.nome} para uma casa de repouso.`, efeito: () => { prox(c, 'pai', -10); fato(c, `casa_repouso_${c.p.pai.id}`); } }) }
    ]
  },

  /* ============================================================== SAÚDE */
  {
    id: 'sau_tratamento', tipo: 'decisao', idade: [12, 100], tema: 'saude', prioritario: true, repetir: 3,
    quando: c => c.idade >= 18 && c.v.corpo.condicoes.some(x => x.cronica && !x.tratando) && !c.v.processos.some(p => p.tipo === 'tratamento'),
    titulo: 'O tratamento',
    texto: c => {
      const cond = c.v.corpo.condicoes.find(x => x.cronica && !x.tratando)!;
      return `O ${cond.nome === 'câncer' ? 'oncologista' : 'médico do posto'} explicou: ${cond.nome} tem tratamento, mas pelo SUS há fila de meses para o especialista. Particular, é para já — e caro.`;
    },
    opcoes: [
      { id: 'sus', texto: 'Entrar na fila do SUS', resolver: c => {
        const cond = c.v.corpo.condicoes.find(x => x.cronica && !x.tratando)!;
        return { texto: 'Você saiu do posto com um papel de encaminhamento e uma estimativa vaga.', memoria: `Entrou na fila do SUS para tratar ${cond.nome}.`, relevancia: 'cotidiano', efeito: () => c.v.processos.push({ tipo: 'tratamento', id: `trat${c.v.seq++}`, condicaoId: cond.id, tFim: c.v.t + (cond.id === 'cancer' ? 4 : 10), rede: 'sus' }) };
      } },
      { id: 'particular', texto: 'Pagar particular', disponivel: c => (c.v.financas.conta + c.v.financas.reserva >= 6000 ? true : 'Não há dinheiro para pagar particular.'),
        resolver: c => {
          const cond = c.v.corpo.condicoes.find(x => x.cronica && !x.tratando)!;
          const custo = cond.id === 'cancer' ? 45000 : 6000;
          return { texto: 'Consulta na mesma semana, exames no mesmo mês.', memoria: `Pagou do bolso o tratamento de ${cond.nome}.`, efeito: () => { cond.tratando = true; dinheiro(c, -custo); } };
        } },
      { id: 'depois', texto: 'Deixar para depois', comportamento: { impulsividade: 1 }, resolver: () => ({ texto: 'Você guardou o papel numa gaveta.', memoria: null }) }
    ]
  }
];

function casar(c: Ctx, custo: number): void {
  const p = c.p.pessoa;
  const vin = c.v.vinculos[p.id];
  mudarEstagio(c.v, vin, 'casamento');
  if (!vin.convivio.includes('casa')) morarJuntos(c.v, p);
  const f = c.v.financas;
  f.conta -= custo;
  if (f.conta < 0 && custo > 20000) {
    // O que faltou vira parcelamento.
    const falta = -f.conta;
    f.conta = 0;
    f.dividas.push({ id: `festa${c.v.seq++}`, tipo: 'emprestimo', saldo: falta, jurosMes: 0.035, parcela: Math.round(falta / 12 * 1.2), descricao: 'Parcelas da festa de casamento' });
  }
  feliz(c, 12);
  c.v.vinculos[p.id].historia.push({ t: c.v.t, texto: 'Casaram-se.' });
}

function tensaoPessoa(c: Ctx, id: string, n: number): void {
  const vin = c.v.vinculos[id];
  if (vin) vin.tensao = Math.min(100, vin.tensao + n);
}

void temEscolaridade; void ROTINAS;
