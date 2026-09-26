/**
 * Situações sociais que nascem do estado das relações.
 *
 * Nada aqui é sorteado do nada: a despedida existe porque alguém central
 * morreu; a descoberta, porque havia um caso; o amigo que manda mensagem
 * existe, tem história com você e anda sumido. A reação é sempre do
 * jogador; a das outras pessoas, delas.
 */

import type { Conteudo, Ctx } from './base';
import type { Pessoa, Vida } from '../tipos';
import * as P from './papeis';
import { dinheiro, envolvimento, estresse, feliz, gp, prox, tensao, custa } from './efeitos';
import { idade, idadePessoa, lembrarCom, vinculosVivos } from '../nucleo';
import { encerrarCaso, mudarEstagio, reacaoATraicao, terminar } from '../sistemas/romance';
import { gestacaoEmCurso } from '../sistemas/familia';
import { quemFicou } from '../sistemas/luto';
import { filhosEmComum, papelDe } from '../sistemas/vinculos';
import { lacoCom } from '../sistemas/rede';
import { aplicarPersonalidade } from '../personalidade';
import { anoDe } from '../tempo';
import { flex } from '../texto';

/* ------------------------------------------------------------ Papéis */

const pendente = (prefixo: string) => (v: Vida): Pessoa[] =>
  Object.keys(v.fatos).filter(k => k.startsWith(prefixo) && v.t - v.fatos[k] <= 12).map(k => v.pessoas[k.slice(prefixo.length)]).filter(Boolean);

const falecido = pendente('despedida:');
const casoDescoberto = pendente('caso_descoberto:');
const casoUltimato = (v: Vida) => Object.keys(v.fatos).filter(k => k.startsWith('caso_ultimato_') && v.t - v.fatos[k] <= 12)
  .map(k => v.pessoas[k.slice('caso_ultimato_'.length)]).filter(p => p?.vivo && v.vinculos[p.id]?.romance?.secreto);

/** O outro pai ou mãe de um filho que morreu: a parceria ao seu lado, ou quem foi parceria um dia. */
function outroGenitorNaDespedida(c: Ctx): string {
  const x = c.p.falecido;
  const co = vinculosVivos(c.v).find(k => !k.p.especie && lacoCom(c.v, k.p.id, x.id) === 'filho');
  if (!co) return '';
  const rom = co.vin.romance;
  const atual = rom && ['namoro', 'morando_junto', 'casamento'].includes(rom.estagio) && !rom.secreto;
  if (atual) return ` ${co.p.nome} está ao seu lado; ${flex(co.p.genero, 'ele', 'ela', 'elu')} perdeu ${flex(x.genero, 'o filho', 'a filha', 'e filhe')} também.`;
  return ` ${co.p.nome}, ${flex(co.p.genero, 'o pai', 'a mãe', 'a mãe')} ${flex(x.genero, 'dele', 'dela', 'delu')}, ${co.p.municipioId !== c.v.moradia.municipioId ? 'está na estrada' : 'já está lá'}.`;
}

const pessoasDaDespedida = (c: Ctx) => quemFicou(c.v, c.p.falecido.id).filter(p => p.id !== c.p.falecido.id);

function lembrancaDe(c: Ctx): string {
  const p = c.p.falecido;
  const papel = papelDe(p, c.v.vinculos[p.id]);
  if (papel === 'parceiro') return c.r.pick(['a aliança', 'as cartas guardadas numa caixa de sapato', 'o relógio']);
  if (papel === 'genitor') return c.r.pick(['a receita escrita à mão', 'a velha caixa de fotografias', 'o chapéu']);
  if (papel === 'filho') return c.r.pick(['o primeiro desenho', 'a camiseta preferida', 'as fotos da infância']);
  if (papel === 'avo') return c.r.pick(['o terço', 'a xícara de sempre', 'uma foto antiga no quintal']);
  return c.r.pick(['uma foto de vocês dois', 'a última mensagem', 'um livro emprestado que nunca voltou']);
}

function anosJuntos(c: Ctx): number {
  const vin = c.v.vinculos[c.p.falecido.id];
  return Math.max(1, Math.round((c.v.t - (vin.romance?.tInicio ?? vin.tInicio)) / 12));
}

function marcarComo(c: Ctx, como: string): void {
  const l = c.v.luto.find(x => x.pessoaId === c.p.falecido.id);
  if (l) l.como = como;
  delete c.v.fatos[`despedida:${c.p.falecido.id}`];
}

/* ------------------------------------------------------------ Catálogo */

export const SOCIAL: Conteudo[] = [
  /* =============================================================== LUTO */
  {
    id: 'luto_despedida', tipo: 'decisao', idade: [12, 120], tema: 'perda', prioritario: true, prioridade: 9, repetir: 0,
    papeis: { falecido },
    titulo: c => c.p.falecido.nome,
    texto: c => {
      const p = c.p.falecido;
      const papel = papelDe(p, c.v.vinculos[p.id]);
      const quem = pessoasDaDespedida(c);
      const chegando = quem.filter(x => x.municipioId !== c.v.moradia.municipioId && !(papel === 'filho' && lacoCom(c.v, x.id, p.id) === 'filho')).slice(0, 2).map(x => x.nome);
      const base = papel === 'parceiro'
        ? `${anosJuntos(c)} anos, e agora a casa está cheia de gente falando baixo. ${p.nome} não está.`
        : papel === 'genitor' ? `O telefone tocou de madrugada. Quando você chegou, já não havia o que fazer por ${p.nome}.`
          : papel === 'filho' ? `Nada prepara para isso. O velório de ${p.nome} é amanhã cedo.${outroGenitorNaDespedida(c)}`
            : `A notícia da morte de ${p.nome} chegou por mensagem, numa terça-feira comum.`;
      return `${base}${chegando.length ? ` ${chegando.join(' e ')} ${chegando.length > 1 ? 'estão' : 'está'} na estrada.` : ''} A despedida é amanhã.`;
    },
    opcoes: [
      {
        id: 'homenagem', texto: c => (papelDe(c.p.falecido, c.v.vinculos[c.p.falecido.id]) === 'parceiro' ? `Falar na despedida sobre a vida com ${c.p.falecido.nome}` : `Prestar uma homenagem a ${c.p.falecido.nome}`),
        resolver: c => ({
          texto: `Você falou. A voz falhou duas vezes, e ninguém se importou. Contou ${c.r.pick(['como se conheceram', 'uma história que só vocês sabiam', 'da risada', 'de uma viagem de anos atrás'])}.`,
          memoria: `Na despedida de ${c.p.falecido.nome}, prestou uma homenagem.`, relevancia: 'biografia', evento: { tipo: 'despedida', pessoaId: c.p.falecido.id },
          efeito: () => { marcarComo(c, 'homenagem'); lembrarCom(c.v, c.p.falecido.id, 'Você se despediu com palavras.', 'perda', 2); }
        })
      },
      {
        id: 'reunir', texto: 'Reunir a família', comportamento: { familia: 1 },
        disponivel: c => (vinculosVivos(c.v).filter(x => x.vin.parentesco && !x.p.especie && x.vin.proximidade >= 35).length >= 2 ? true : 'Não há quase ninguém da família por perto.'),
        resolver: c => ({
          texto: 'Depois do enterro, todo mundo foi para a sua casa. Comeram, choraram, riram de uma história antiga. Ficaram até tarde.',
          memoria: `Reuniu a família depois da despedida de ${c.p.falecido.nome}.`, relevancia: 'biografia', evento: { tipo: 'despedida', pessoaId: c.p.falecido.id },
          efeito: () => { marcarComo(c, 'reunir'); for (const { p, vin } of vinculosVivos(c.v)) if (vin.parentesco && !p.especie && vin.proximidade >= 30) { vin.proximidade = Math.min(100, vin.proximidade + 5); vin.tUltimoContato = c.v.t; } }
        })
      },
      {
        id: 'lembranca', texto: 'Guardar uma lembrança',
        resolver: c => {
          const o = lembrancaDe(c);
          return {
            texto: `Você guardou ${o}. Ficou numa gaveta que você abre de vez em quando.`,
            memoria: `Guardou ${o} de ${c.p.falecido.nome}.`.replace('a última mensagem de', 'a última mensagem de').replace('uma foto de vocês dois de', 'uma foto de vocês dois, de'), relevancia: 'biografia', evento: { tipo: 'despedida', pessoaId: c.p.falecido.id },
            efeito: () => { marcarComo(c, 'lembranca'); lembrarCom(c.v, c.p.falecido.id, `Você guardou ${o}.`, 'perda', 2); }
          };
        }
      },
      {
        id: 'apoiar', texto: c => { const x = pessoasDaDespedida(c)[0]; return x ? `Cuidar de ${x.nome}, que sofre mais` : 'Cuidar de quem ficou'; }, comportamento: { empatia: 1 },
        disponivel: c => (pessoasDaDespedida(c).length ? true : false),
        resolver: c => {
          const x = pessoasDaDespedida(c)[0];
          return {
            texto: `Você ficou perto de ${x.nome} os dias todos. Às vezes em silêncio, às vezes arrumando o que precisava ser arrumado.`,
            memoria: `Cuidou de ${x.nome} no luto por ${c.p.falecido.nome}.`, relevancia: 'biografia', evento: { tipo: 'despedida', pessoaId: c.p.falecido.id },
            efeito: () => {
              marcarComo(c, 'apoiar');
              const vin = c.v.vinculos[x.id];
              if (vin) { vin.proximidade = Math.min(100, vin.proximidade + 10); vin.confianca = Math.min(100, vin.confianca + 8); vin.tUltimoContato = c.v.t; }
              if (x.aperto) x.aperto.t -= 10;
              lembrarCom(c.v, x.id, `Você esteve com ${flex(x.genero, 'ele', 'ela', 'elu')} quando ${c.p.falecido.nome} morreu.`, 'apoio', 2);
            }
          };
        }
      },
      {
        id: 'rotina', texto: 'Voltar logo para a rotina',
        resolver: c => ({ texto: 'Na segunda-feira, você estava de volta à rotina de sempre.', memoria: null, efeito: () => { marcarComo(c, 'rotina'); estresse(c, 4); } })
      },
      {
        id: 'sozinho', texto: c => `Precisar de um tempo sozinh${c.g('o', 'a', 'e')}`,
        resolver: c => ({ texto: 'Você desligou o telefone por uns dias. Ninguém cobrou.', memoria: null, efeito: () => { marcarComo(c, 'sozinho'); estresse(c, -4); } })
      }
    ]
  },

  /* ============================================================= TRAIÇÃO */
  {
    id: 'rom_descoberta', tipo: 'decisao', idade: [16, 100], tema: 'amor', prioritario: true, prioridade: 8, repetir: 0,
    papeis: { pessoa: P.parceiro, caso: casoDescoberto },
    titulo: 'As mensagens',
    texto: c => `${c.p.pessoa.nome} achou as mensagens com ${c.p.caso.nome}. Está ${gp(c, 'pessoa', 'sentado', 'sentada', 'sentade')} na beira da cama, com o seu celular na mão, esperando você explicar.`,
    opcoes: [
      {
        id: 'perdao', texto: 'Admitir tudo e pedir perdão',
        resolver: c => {
          const vin = c.v.vinculos[c.p.pessoa.id];
          const vc = c.v.vinculos[c.p.caso.id];
          if (vc?.romance && vc.romance.estagio !== 'ex') encerrarCaso(c.v, c.p.caso, vc);
          const reacao = reacaoATraicao(c.v, c.r, c.p.pessoa, vin, false);
          fim(c);
          return {
            texto: reacao === 'ficou' ? `${c.p.pessoa.nome} não foi embora. Disse que ia tentar, e que não sabia se ia conseguir.` : `${c.p.pessoa.nome} ouviu tudo sem dizer nada. Depois fez as malas.`,
            memoria: `${c.p.pessoa.nome} descobriu o caso com ${c.p.caso.nome}. Você admitiu tudo${reacao === 'ficou' ? '; ficaram juntos, com a confiança em pedaços' : ''}.`,
            relevancia: 'marco', tom: 'ruim', evento: { tipo: 'traicao_descoberta', pessoaId: c.p.pessoa.id, peso: 70 }
          };
        }
      },
      {
        id: 'negar', texto: 'Negar', comportamento: { empatia: -1 },
        resolver: c => {
          const vin = c.v.vinculos[c.p.pessoa.id];
          fim(c);
          if (c.r.chance(0.25 + vin.confianca / 400)) {
            vin.confianca = Math.max(0, vin.confianca - 25);
            vin.tensao = Math.min(100, vin.tensao + 30);
            if (vin.romance) vin.romance.segredo = { pessoaId: c.p.caso.id, t: c.v.t };
            return { texto: `${c.p.pessoa.nome} quis acreditar. Não acreditou inteiro.`, memoria: null };
          }
          const reacao = reacaoATraicao(c.v, c.r, c.p.pessoa, vin, false);
          vin.confianca = 0;
          return {
            texto: reacao === 'ficou' ? `${c.p.pessoa.nome} não acreditou em nada, e mesmo assim ficou. A casa ficou fria.` : `${c.p.pessoa.nome} não acreditou numa palavra. Foi embora na mesma noite.`,
            memoria: `${c.p.pessoa.nome} descobriu o caso com ${c.p.caso.nome}. Você negou.`, relevancia: 'marco', tom: 'ruim', evento: { tipo: 'traicao_descoberta', pessoaId: c.p.pessoa.id, peso: 70 }
          };
        }
      },
      {
        id: 'assumir', texto: c => `Assumir e ficar com ${c.p.caso.nome}`, comportamento: { independencia: 1 },
        resolver: c => {
          const vin = c.v.vinculos[c.p.pessoa.id];
          terminar(c.v, c.p.pessoa, vin, 'jogador', 'traicao');
          const vc = c.v.vinculos[c.p.caso.id];
          if (vc?.romance) { vc.romance.secreto = undefined; mudarEstagio(c.v, vc, 'namoro'); lembrarCom(c.v, c.p.caso.id, 'Deixou de ser segredo.', 'romance', 3); }
          fim(c);
          return { texto: `Você disse a verdade inteira, e que ia embora. ${c.p.pessoa.nome} não pediu para você ficar.`, memoria: `Terminou com ${c.p.pessoa.nome} para ficar com ${c.p.caso.nome}.`, relevancia: 'marco', tom: 'ruim', evento: { tipo: 'ruptura', pessoaId: c.p.pessoa.id, peso: 70 } };
        }
      }
    ]
  },
  {
    id: 'rom_caso_ultimato', tipo: 'decisao', idade: [16, 100], tema: 'amor', prioritario: true, prioridade: 7, repetir: 0,
    papeis: { caso: casoUltimato, pessoa: P.parceiro },
    titulo: c => c.p.caso.nome,
    texto: c => `Depois de dois anos escondido, ${c.p.caso.nome} disse que cansou de ser segredo: ou vocês assumem, ou acabou.`,
    opcoes: [
      {
        id: 'assumir', texto: c => `Terminar com ${c.p.pessoa.nome} e ficar com ${c.p.caso.nome}`,
        resolver: c => {
          terminar(c.v, c.p.pessoa, c.v.vinculos[c.p.pessoa.id], 'jogador');
          const vc = c.v.vinculos[c.p.caso.id];
          if (vc.romance) { vc.romance.secreto = undefined; mudarEstagio(c.v, vc, 'namoro'); }
          lembrarCom(c.v, c.p.caso.id, 'Deixou de ser segredo.', 'romance', 3);
          delete c.v.fatos[`caso_ultimato_${c.p.caso.id}`];
          return { texto: `Você contou a ${c.p.pessoa.nome} e saiu de casa com uma mochila.`, memoria: `Deixou ${c.p.pessoa.nome} para ficar com ${c.p.caso.nome}.`, relevancia: 'marco', evento: { tipo: 'ruptura', pessoaId: c.p.pessoa.id, peso: 70 } };
        }
      },
      {
        id: 'encerrar', texto: 'Terminar o caso', comportamento: { familia: 1 },
        resolver: c => {
          encerrarCaso(c.v, c.p.caso, c.v.vinculos[c.p.caso.id]);
          delete c.v.fatos[`caso_ultimato_${c.p.caso.id}`];
          return { texto: `${c.p.caso.nome} apagou seu número na sua frente.`, memoria: null, efeito: () => estresse(c, -4) };
        }
      },
      {
        id: 'adiar', texto: 'Pedir mais tempo',
        resolver: c => {
          delete c.v.fatos[`caso_ultimato_${c.p.caso.id}`];
          const vc = c.v.vinculos[c.p.caso.id];
          if (vc.romance) vc.romance.envolvimento = Math.max(0, vc.romance.envolvimento - 18);
          return { texto: `${c.p.caso.nome} disse "tá". Não disse até quando.`, memoria: null };
        }
      }
    ]
  },

  /* ============================================================== FILHOS */
  {
    id: 'fil_largar_escola', tipo: 'decisao', idade: [25, 80], tema: 'filhos', prioritario: true, prioridade: 4, repetir: 0,
    papeis: { filho: v => P.filhoEmCasa(15, 17)(v).filter(f => v.fatos[`fil_largar_${f.id}`] === v.t && !f.vida?.parouDeEstudar) },
    titulo: c => `${c.p.filho.nome} e a escola`,
    texto: c => `${c.p.filho.nome} disse na mesa do jantar que não vai mais para a escola. "Não serve para nada. Quero trabalhar." Tem ${idadePessoa(c.v, c.p.filho)} anos.`,
    opcoes: [
      {
        id: 'insistir', texto: 'Insistir que termine o médio', comportamento: { disciplina: 1 },
        resolver: c => {
          const vin = c.v.vinculos[c.p.filho.id];
          const escuta = (vin.confianca + (vin.presenca ?? 30)) / 200;
          if (c.r.chance(0.35 + escuta * 0.5)) {
            tensao(c, 'filho', 10);
            return { texto: `${c.p.filho.nome} bufou, bateu a porta — e voltou para a escola na segunda.`, memoria: null, lembrar: ['filho', 'Quis largar a escola; você insistiu, e deu certo.'] };
          }
          largar(c);
          tensao(c, 'filho', 18);
          return { texto: `${c.p.filho.nome} não voltou. Tinha decidido antes de contar.`, memoria: `${c.p.filho.nome} largou a escola aos ${idadePessoa(c.v, c.p.filho)}.`, lembrar: ['filho', 'Largou a escola, contra a sua vontade.'], tom: 'ruim' };
        }
      },
      {
        id: 'aceitar', texto: 'Aceitar e ajudar a procurar trabalho', comportamento: { independencia: 1 },
        resolver: c => { largar(c); prox(c, 'filho', 4); return { texto: `Vocês montaram um currículo juntos. ${c.p.filho.nome} saiu para entregar numa manhã de chuva.`, memoria: `${c.p.filho.nome} largou a escola aos ${idadePessoa(c.v, c.p.filho)} para trabalhar.`, lembrar: ['filho', 'Largou a escola; você ajudou a procurar emprego.'] }; }
      },
      {
        id: 'supletivo', texto: 'Propor terminar no supletivo, à noite',
        resolver: c => {
          const vin = c.v.vinculos[c.p.filho.id];
          if (c.r.chance(0.3 + vin.confianca / 250)) {
            return { texto: `${c.p.filho.nome} topou trabalhar de dia e estudar à noite. Vai demorar mais; vai terminar.`, memoria: null, lembrar: ['filho', 'Trocou a escola pelo supletivo à noite.'] };
          }
          largar(c);
          return { texto: `${c.p.filho.nome} disse que ia pensar. Não se matriculou.`, memoria: `${c.p.filho.nome} largou a escola aos ${idadePessoa(c.v, c.p.filho)}.` };
        }
      }
    ]
  },

  /* ============================================================= AMIGOS */
  {
    id: 'soc_amigo_mensagem', tipo: 'decisao', idade: [22, 100], tema: 'amizade', repetir: 5, peso: 1.4,
    papeis: {
      amigo: v => vinculosVivos(v).filter(x => !x.vin.parentesco && !x.vin.romance && !x.p.especie && x.vin.historia.some(h => (h.peso ?? 1) >= 2)
        && (x.vin.estagio === 'afastado' || x.vin.proximidade < 45) && v.t - x.vin.tUltimoContato >= 36 && idadePessoa(v, x.p) >= 18
        && !x.vin.historia.some(h => h.tipo === 'reconciliacao' && v.t - h.t < 180)).map(x => x.p)
    },
    titulo: c => c.p.amigo.nome,
    texto: c => `Uma mensagem de ${c.p.amigo.nome}, depois de anos: "Lembrei de você hoje, ${c.r.pick(['passando na frente da escola', 'ouvindo aquela música', 'vendo uma foto antiga'])}. Tudo bem por aí?"`,
    opcoes: [
      { id: 'encontrar', texto: 'Responder e marcar um café', comportamento: { sociabilidade: 1 },
        resolver: c => ({ texto: `O café durou três horas. ${c.p.amigo.nome} está diferente e igual.`, memoria: `Reencontrou ${c.p.amigo.nome} depois de anos.`, lembrar: ['amigo', 'Voltaram a se ver depois de anos.', 'reconciliacao'], evento: { tipo: 'reencontro', pessoaId: c.p.amigo.id, peso: 20 },
          efeito: () => { prox(c, 'amigo', 18); const vin = c.v.vinculos[c.p.amigo.id]; if (vin.proximidade >= 40) vin.estagio = 'amigo'; } }) },
      { id: 'responder', texto: 'Responder com carinho, sem marcar nada', resolver: c => ({ texto: 'Trocaram fotos e prometeram se ver. Talvez.', memoria: null, efeito: () => prox(c, 'amigo', 6) }) },
      { id: 'ignorar', texto: 'Deixar para responder depois', resolver: () => ({ texto: 'O depois não chegou.', memoria: null }) }
    ]
  },

  /* ============================================================ PARCERIA */
  {
    id: 'soc_parceiro_distante', tipo: 'decisao', idade: [22, 95], tema: 'amor', prioritario: true, repetir: 4,
    papeis: { pessoa: P.conjuge },
    quando: c => {
      const vin = c.v.vinculos[c.p.pessoa.id];
      const ano = Math.floor(c.v.t / 12);
      const cuidou = [ano - 1, ano - 2].some(a => c.v.fatos[`cuidou_${c.p.pessoa.id}_${a}`] !== undefined);
      return (vin.romance?.envolvimento ?? 50) < 52 && !cuidou && c.v.t - (vin.romance?.tInicio ?? vin.tInicio) >= 36 && vin.tensao < 45;
    },
    titulo: c => c.p.pessoa.nome,
    texto: c => `${c.p.pessoa.nome} disse, sem briga, só cansaço: "A gente virou dois colegas de apartamento." Faz tempo que vocês não fazem nada só os dois.`,
    opcoes: [
      { id: 'viagem', texto: 'Propor uma viagem só de vocês', disponivel: c => custa(c, 2500, 'Não há dinheiro para viajar agora.'), comportamento: { familia: 1 },
        resolver: c => ({ texto: 'Três dias numa pousada. Na segunda noite, riram como não riam havia anos.', memoria: `Viajou só com ${c.p.pessoa.nome} para recomeçar.`, lembrar: ['pessoa', 'Uma viagem só de vocês, para recomeçar.', 'reconciliacao'], efeito: () => { dinheiro(c, -2500); envolvimento(c, 'pessoa', 14); feliz(c, 5); } }) },
      { id: 'rotina', texto: 'Combinar uma noite por semana só de vocês', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Quinta-feira virou a noite de vocês. Na terceira semana, você quase esqueceu. Não esqueceu.', memoria: null, lembrar: ['pessoa', 'Combinaram uma noite por semana só de vocês.'], efeito: () => { envolvimento(c, 'pessoa', 9); const vin = c.v.vinculos[c.p.pessoa.id]; (vin.habitos ??= {}).sair = (vin.habitos.sair ?? 0) + 1; } }) },
      { id: 'fase', texto: 'Dizer que é só uma fase', resolver: c => ({ texto: `${c.p.pessoa.nome} disse "tá bom" e foi dormir primeiro.`, memoria: null, efeito: () => { envolvimento(c, 'pessoa', -6); tensao(c, 'pessoa', 10); } }) }
    ]
  },
  {
    id: 'soc_quer_filho', tipo: 'decisao', idade: [20, 55], tema: 'filhos', prioritario: true, repetir: 3,
    papeis: { pessoa: P.parceiro },
    quando: c => {
      const p = c.p.pessoa;
      const vin = c.v.vinculos[p.id];
      const rom = vin.romance!;
      const podem = c.v.corpo.podeGestar || p.genero === 'feminino';
      const gestanteIdade = c.v.corpo.podeGestar ? idade(c.v) : idadePessoa(c.v, p);
      return podem && p.querFilhos === 'sim' && rom.planoFilhos !== 'tentando' && !gestacaoEmCurso(c.v) && filhosEmComum(c.v, p.id).length === 0
        && idade(c.v) >= 20 && idadePessoa(c.v, p) >= 24 && gestanteIdade <= 42 && c.v.t - (rom.tInicio ?? vin.tInicio) >= 24
        && c.v.fatos[`recusou_filhos_${p.id}`] === undefined && rom.envolvimento >= 50;
    },
    titulo: c => `${c.p.pessoa.nome} quer um filho`,
    texto: c => `${c.p.pessoa.nome} esperou você terminar o café e disse que não quer mais esperar: quer ter um filho com você. "E você?"`,
    opcoes: [
      { id: 'tentar', texto: 'Começar a tentar', comportamento: { familia: 1 },
        resolver: c => ({ texto: `${c.p.pessoa.nome} sorriu com o rosto inteiro.`, memoria: `Decidiu com ${c.p.pessoa.nome} tentar ter um filho.`, lembrar: ['pessoa', 'Decidiram tentar ter um filho.', 'filho'], efeito: () => { const rom = c.v.vinculos[c.p.pessoa.id].romance!; rom.planoFilhos = 'tentando'; envolvimento(c, 'pessoa', 8); } }) },
      { id: 'esperar', texto: 'Pedir mais um tempo', resolver: c => ({ texto: `${c.p.pessoa.nome} disse que espera. Perguntou quanto.`, memoria: null, efeito: () => tensao(c, 'pessoa', 6) }) },
      { id: 'nunca', texto: 'Dizer que não quer ter filhos', comportamento: { independencia: 1 },
        resolver: c => ({ texto: `${c.p.pessoa.nome} ficou muito tempo olhando a xícara vazia.`, memoria: `Disse a ${c.p.pessoa.nome} que não quer ter filhos.`, lembrar: ['pessoa', 'Você disse que não quer ter filhos.', 'conflito'], efeito: () => { c.v.fatos[`recusou_filhos_${c.p.pessoa.id}`] = c.v.t; tensao(c, 'pessoa', 22); envolvimento(c, 'pessoa', -10); } }) }
    ]
  },
  {
    id: 'gest_preparo', tipo: 'acontecimento', idade: [14, 60], tema: 'filhos', prioritario: true, repetir: 0,
    quando: c => { const g = gestacaoEmCurso(c.v); return !!g && g.descoberta && g.tParto > c.v.t && c.v.fatos[`preparo_${g.id}`] === undefined; },
    narrar: c => {
      const g = gestacaoEmCurso(c.v)!;
      const par = P.parceiro(c.v)[0];
      const pequena = c.v.moradia.modeloId === 'kitnet' || c.v.moradia.tipo === 'republica';
      const casaDosPais = c.v.moradia.tipo === 'pais' || c.v.moradia.tipo === 'parente';
      const texto = casaDosPais
        ? 'Em casa, um canto do quarto virou o canto do bebê. A família inteira passou a opinar sobre tudo.'
        : `${par ? `Você e ${par.nome} montaram` : 'Você montou'} o berço num domingo, com o manual ao contrário.${pequena ? ' Ele ficou no pé da cama: a casa ficou pequena de repente.' : ''} O enxoval foi chegando aos poucos, de presente.`;
      return {
        texto, relevancia: 'cotidiano', tom: 'bom',
        efeito: () => { c.v.fatos[`preparo_${g.id}`] = c.v.t; if (par) { lembrarCom(c.v, par.id, 'Montaram juntos o berço.', 'filho', 1); envolvimento({ ...c, p: { pessoa: par } }, 'pessoa', 3); } }
      };
    }
  },

  /* ============================================================ FAMÍLIA */
  {
    id: 'soc_conflito_antigo', tipo: 'decisao', idade: [20, 100], tema: 'familia', repetir: 8,
    papeis: {
      pessoa: v => vinculosVivos(v).filter(x => x.vin.parentesco && !x.p.especie && idadePessoa(v, x.p) >= 18 && x.vin.proximidade < 45
        && x.vin.historia.some(h => h.tipo === 'conflito' && (h.peso ?? 1) >= 1 && v.t - h.t >= 36)).map(x => x.p)
    },
    titulo: c => c.p.pessoa.nome,
    texto: c => `${c.p.pessoa.nome} ligou. Faz tempo que vocês não se falam direito — desde ${anoDe(c.v.vinculos[c.p.pessoa.id].historia.filter(h => h.tipo === 'conflito').slice(-1)[0].t)}. A voz do outro lado estava diferente.`,
    opcoes: [
      { id: 'pazes', texto: 'Fazer as pazes', comportamento: { empatia: 1, familia: 1 },
        resolver: c => ({ texto: 'Ninguém pediu desculpas direito. Mas no fim, combinaram um almoço.', memoria: `Fez as pazes com ${c.p.pessoa.nome}.`, lembrar: ['pessoa', 'Fizeram as pazes, anos depois.', 'reconciliacao'], evento: { tipo: 'reconciliacao', pessoaId: c.p.pessoa.id, peso: 30 },
          efeito: () => { tensao(c, 'pessoa', -45); prox(c, 'pessoa', 15); const vin = c.v.vinculos[c.p.pessoa.id]; vin.confianca = Math.min(100, vin.confianca + 10); } }) },
      { id: 'ouvir', texto: 'Ouvir, sem prometer nada', resolver: c => ({ texto: 'Vocês falaram de amenidades. Foi mais do que nada.', memoria: null, efeito: () => { tensao(c, 'pessoa', -15); prox(c, 'pessoa', 5); } }) },
      { id: 'desligar', texto: 'Dizer que não tem nada para conversar', comportamento: { independencia: 1 },
        resolver: c => ({ texto: 'A ligação durou quarenta segundos.', memoria: null, lembrar: ['pessoa', 'Tentou reatar; você não quis.', 'conflito'], efeito: () => { tensao(c, 'pessoa', 10); prox(c, 'pessoa', -6); } }) }
    ]
  }
];

function fim(c: Ctx): void {
  for (const k of Object.keys(c.v.fatos)) if (k.startsWith('caso_descoberto:')) delete c.v.fatos[k];
}

function largar(c: Ctx): void {
  const f = c.p.filho;
  if (f.vida) f.vida.parouDeEstudar = true;
  f.ocupacao = undefined;
}

void aplicarPersonalidade;
