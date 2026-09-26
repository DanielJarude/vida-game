/**
 * O que nasce DEPOIS de uma perda, na rede de quem ficou.
 *
 * Nada aqui é sorteado: cada situação existe porque o estado a sustenta —
 * a parceria perdeu o filho junto com você (`luto_casal:`), um filho seu
 * morreu deixando crianças (`netos_orfaos:`), seu pai ou sua mãe ficou
 * viúvo e sozinho. O jogo diz o que aconteceu com os outros; o que fazer
 * com isso é do jogador, e cada opção diz antes o que muda.
 */

import type { Conteudo, Ctx } from './base';
import type { Pessoa, Vida } from '../tipos';
import { envolvimento, estresse, prox, tensao } from './efeitos';
import { idadePessoa, lembrarCom, vinculosVivos } from '../nucleo';
import { flex } from '../texto';
import { lacoCom, oLaco, paisDe } from '../sistemas/rede';
import { moraComFamiliaDeOrigem } from '../sistemas/domicilio';

/** Quem a chave de fato aponta (o falecido), se o prazo ainda vale (entre um e dois anos depois). */
function falecidoDe(v: Vida, prefixo: string, min = 10, max = 24): Pessoa[] {
  return Object.keys(v.fatos)
    .filter(k => k.startsWith(prefixo) && v.t - v.fatos[k] >= min && v.t - v.fatos[k] <= max)
    .map(k => v.pessoas[k.slice(prefixo.length)])
    .filter((p): p is Pessoa => !!p && !p.vivo);
}

const ele = (p: Pessoa) => flex(p.genero, 'ele', 'ela', 'elu');
const dele = (p: Pessoa) => flex(p.genero, 'dele', 'dela', 'delu');

/** A parceria de hoje, se é quem também perdeu (a mãe, o pai do filho que morreu). */
function parceriaEnlutada(v: Vida, x: Pessoa): Pessoa | undefined {
  for (const { p, vin } of vinculosVivos(v)) {
    const rom = vin.romance;
    if (!rom || !['namoro', 'morando_junto', 'casamento'].includes(rom.estagio) || rom.secreto) continue;
    if (lacoCom(v, p.id, x.id) === 'filho') return p;
  }
  return undefined;
}

/** O que, em casa, lembra quem se foi — só o que o estado sustenta. */
function oQueLembra(c: Ctx, x: Pessoa): string {
  const netos = Object.values(c.v.pessoas).filter(n => n.vivo && n.genitores?.includes(x.id) && c.v.vinculos[n.id]);
  if (netos.length) return netos.length === 1 ? `${netos[0].nome}, ${flex(netos[0].genero, 'o filho', 'a filha', 'e filhe')} ${dele(x)}, está cada vez mais parecid${flex(netos[0].genero, 'o', 'a', 'e')} com ${ele(x)}` : `os filhos ${dele(x)} crescem, e cada aniversário tem uma cadeira a menos`;
  const i = Math.floor(((x.tMorte ?? c.v.t) - x.tNasc) / 12);
  return i < 25 ? `o quarto ${dele(x)} continua quase como estava` : `as fotos ${dele(x)} continuam na estante`;
}

/** Entre os dois, hoje: o que o vínculo diz (nunca o que cada um sente por dentro). */
function entreOsDois(c: Ctx, par: Pessoa): string {
  const vin = c.v.vinculos[par.id];
  const env = vin.romance?.envolvimento ?? 50;
  if (vin.tensao >= 40) return `Entre você e ${par.nome}, qualquer conversa sobre isso termina em silêncio ou em briga.`;
  if (env < 45) return `Você e ${par.nome} têm atravessado isso cada um no seu canto.`;
  return `Você e ${par.nome} têm se amparado, do jeito que dá.`;
}

export const REDE: Conteudo[] = [
  /* ================================================ O luto do casal */
  {
    id: 'rede_luto_casal', tipo: 'decisao', idade: [18, 110], tema: 'perda', prioritario: true, prioridade: 6, repetir: 0,
    papeis: { falecido: v => falecidoDe(v, 'luto_casal:').filter(x => !!parceriaEnlutada(v, x)) },
    quando: c => !!parceriaEnlutada(c.v, c.p.falecido),
    titulo: c => `Um ano sem ${c.p.falecido.nome}`,
    texto: c => {
      const x = c.p.falecido;
      const par = parceriaEnlutada(c.v, x)!;
      return `Faz quase um ano que ${x.nome} morreu. Em casa, a falta aparece nas coisas pequenas: ${oQueLembra(c, x)}. ${entreOsDois(c, par)}`;
    },
    opcoes: [
      {
        id: 'conversar', texto: c => `Falar com ${parceriaEnlutada(c.v, c.p.falecido)!.nome} sobre ${c.p.falecido.nome}, de verdade`, comportamento: { empatia: 1, familia: 1 },
        consequencia: c => `Aproxima vocês dois; é uma conversa que pesa.${c.v.vinculos[parceriaEnlutada(c.v, c.p.falecido)!.id].tensao >= 40 ? ' Com o clima de agora, pode doer antes de ajudar.' : ''}`,
        resolver: c => {
          const par = parceriaEnlutada(c.v, c.p.falecido)!;
          const vin = c.v.vinculos[par.id];
          const tenso = vin.tensao >= 40;
          return {
            texto: tenso
              ? `A conversa começou torta e acabou de madrugada. ${par.nome} disse coisas que guardava desde o enterro. Vocês não resolveram nada — mas falaram.`
              : `Vocês abriram as fotos de ${c.p.falecido.nome} na mesa da cozinha e falaram até tarde. Pela primeira vez em meses, riram de uma história ${dele(c.p.falecido)}.`,
            memoria: `Um ano depois da morte de ${c.p.falecido.nome}, conversou com ${par.nome} sobre a perda.`, relevancia: 'biografia',
            efeito: () => {
              const q = { ...c, p: { ...c.p, par } };
              envolvimento(q, 'par', tenso ? 4 : 9); tensao(q, 'par', tenso ? -8 : -12); prox(q, 'par', 6); estresse(c, 3);
              lembrarCom(c.v, par.id, `Falaram de ${c.p.falecido.nome}, um ano depois.`, 'apoio', 2);
              if (par.aperto?.tipo === 'luto') par.aperto.t -= 8;
            }
          };
        }
      },
      {
        id: 'grupo', texto: 'Procurar juntos um grupo de apoio ao luto', comportamento: { familia: 1 },
        consequencia: () => 'Um encontro por semana, com outros pais que passaram pelo mesmo (há grupos gratuitos na rede pública e em associações). O luto de vocês dois anda mais leve.',
        resolver: c => {
          const par = parceriaEnlutada(c.v, c.p.falecido)!;
          return {
            texto: `Numa sala com cadeiras em círculo, vocês ouviram outras histórias parecidas com a de ${c.p.falecido.nome}. Na volta, ${par.nome} segurou a sua mão.`,
            memoria: `Com ${par.nome}, frequentou um grupo de apoio ao luto depois da morte de ${c.p.falecido.nome}.`, relevancia: 'biografia',
            efeito: () => {
              const q = { ...c, p: { ...c.p, par } };
              envolvimento(q, 'par', 6); tensao(q, 'par', -6);
              for (const l of c.v.luto) if (l.pessoaId === c.p.falecido.id) l.peso = Math.round(l.peso * 0.7);
              if (par.aperto?.tipo === 'luto') par.aperto.t -= 10;
              lembrarCom(c.v, par.id, `Foram juntos a um grupo de apoio depois de ${c.p.falecido.nome}.`, 'apoio', 2);
            }
          };
        }
      },
      {
        id: 'espaco', texto: 'Deixar que cada um atravesse do seu jeito',
        consequencia: c => c.v.vinculos[parceriaEnlutada(c.v, c.p.falecido)!.id].tensao >= 40 ? 'Nada muda de uma vez — e a distância que já existe pode crescer.' : 'Nada muda de uma vez; cada um no seu tempo.',
        resolver: c => {
          const par = parceriaEnlutada(c.v, c.p.falecido)!;
          const tenso = c.v.vinculos[par.id].tensao >= 40;
          return {
            texto: tenso ? `Cada um seguiu no seu canto. A casa ficou mais quieta do que precisava.` : `Cada um seguiu no seu tempo. Há dias bons e dias em que ninguém fala o nome ${dele(c.p.falecido)}.`,
            memoria: null,
            efeito: () => { if (tenso) { const q = { ...c, p: { ...c.p, par } }; envolvimento(q, 'par', -5); tensao(q, 'par', 4); } }
          };
        }
      },
      {
        id: 'ocupar', texto: 'Se ocupar com o trabalho e a rotina',
        consequencia: () => 'O trabalho ocupa a cabeça; em casa, a distância entre vocês pode crescer.',
        resolver: c => {
          const par = parceriaEnlutada(c.v, c.p.falecido)!;
          return {
            texto: `Você passou a chegar mais tarde. ${par.nome} parou de perguntar por quê.`,
            memoria: `Depois da morte de ${c.p.falecido.nome}, mergulhou no trabalho.`, relevancia: 'cotidiano',
            efeito: () => { const q = { ...c, p: { ...c.p, par } }; envolvimento(q, 'par', -8); tensao(q, 'par', 8); estresse(c, -3); }
          };
        }
      }
    ]
  },

  /* ============================================ Os filhos de quem se foi */
  {
    id: 'rede_netos_orfaos', tipo: 'decisao', idade: [30, 110], tema: 'familia', prioritario: true, prioridade: 7, repetir: 0,
    papeis: { falecido: v => falecidoDe(v, 'netos_orfaos:', 0, 12) },
    quando: c => netosDe(c.v, c.p.falecido).length > 0,
    titulo: c => { const n = netosDe(c.v, c.p.falecido); return n.length === 1 ? `${n[0].nome}` : 'Os filhos de ' + c.p.falecido.nome; },
    texto: c => {
      const x = c.p.falecido;
      const n = netosDe(c.v, x);
      const outro = outroGenitor(c.v, x);
      const quem = n.length === 1 ? `${n[0].nome}, ${n[0].genero === 'feminino' ? 'a filha' : 'o filho'} de ${x.nome}, tem ${idadePessoa(c.v, n[0])} anos` : `Os filhos de ${x.nome} têm ${n.map(k => idadePessoa(c.v, k)).sort((a, b) => a - b).join(' e ')} anos`;
      return outro
        ? `${quem}. ${n.length === 1 ? 'Ficou' : 'Ficaram'} com ${outro.nome}, ${oLaco('genitor', outro.genero)}, que agora cuida de tudo sozinh${flex(outro.genero, 'o', 'a', 'e')} — trabalho, escola, a casa.`
        : `${quem}, e ${n.length === 1 ? 'não tem' : 'não têm'} mais pai nem mãe. Alguém da família precisa decidir com quem ${n.length === 1 ? 'fica' : 'ficam'}.`;
    },
    opcoes: [
      {
        id: 'criar', texto: c => (netosDe(c.v, c.p.falecido).length === 1 ? `Trazer ${netosDe(c.v, c.p.falecido)[0].nome} para morar com você` : 'Trazer os netos para morar com você'), comportamento: { familia: 2, generosidade: 1 },
        disponivel: c => (moraComFamiliaDeOrigem(c.v) ? 'Você não mora numa casa sua para receber crianças.' : true),
        consequencia: c => { const n = netosDe(c.v, c.p.falecido); return `${outroGenitor(c.v, c.p.falecido) ? 'Com o acordo de ' + outroGenitor(c.v, c.p.falecido)!.nome + ', ' : ''}${n.length === 1 ? `${n[0].nome} passa` : 'as crianças passam'} a morar com você: a casa enche, a semana aperta, as despesas crescem.`; },
        resolver: c => {
          const n = netosDe(c.v, c.p.falecido);
          return {
            texto: `As mochilas chegaram numa sexta-feira. ${n.length === 1 ? n[0].nome : 'As crianças'} ${n.length === 1 ? 'escolheu' : 'escolheram'} o quarto dos fundos.`,
            memoria: `Depois da morte de ${c.p.falecido.nome}, levou ${n.length === 1 ? `${flex(n[0].genero, 'o neto', 'a neta', 'e nete')}, ${n[0].nome},` : 'os netos'} para morar com você.`, relevancia: 'marco',
            efeito: () => {
              for (const k of n) {
                const vin = c.v.vinculos[k.id];
                if (!vin) continue;
                if (!vin.convivio.includes('casa')) vin.convivio.push('casa');
                k.municipioId = c.v.moradia.municipioId;
                vin.proximidade = Math.min(100, vin.proximidade + 15);
                vin.presenca = Math.max(vin.presenca ?? 0, 55);
                vin.tUltimoContato = c.v.t;
                c.v.fatos[`guarda_neto_${k.id}`] = c.v.t;
                lembrarCom(c.v, k.id, `Veio morar com você depois que perdeu ${oLaco('genitor', c.p.falecido.genero)}.`, 'casa', 3);
              }
            }
          };
        }
      },
      {
        id: 'ajudar', texto: c => { const n = netosDe(c.v, c.p.falecido); const quem = n.length === 1 ? n[0].nome : 'as crianças'; return outroGenitor(c.v, c.p.falecido) ? `Ajudar ${outroGenitor(c.v, c.p.falecido)!.nome} a criar ${quem}, de perto` : 'Ajudar de perto, sem trazer para casa'; }, comportamento: { familia: 1 },
        consequencia: c => { const n = netosDe(c.v, c.p.falecido); return n.length === 1 ? `Você entra na rotina de ${n[0].nome} (buscar na escola, fins de semana): mais tempo com ${flex(n[0].genero, 'ele', 'ela', 'elu')}, menos semana para você.` : 'Você entra na rotina das crianças (buscar na escola, fins de semana): mais tempo com elas, menos semana para você.'; },
        resolver: c => {
          const n = netosDe(c.v, c.p.falecido);
          return {
            texto: `Terça e quinta, a escola. Sábado, o almoço na sua casa. ${n.length === 1 ? n[0].nome : 'As crianças'} já sabe${n.length === 1 ? '' : 'm'} o caminho.`,
            memoria: `Depois da morte de ${c.p.falecido.nome}, passou a ajudar a criar ${n.length === 1 ? n[0].nome : 'os netos'}.`, relevancia: 'biografia',
            efeito: () => {
              for (const k of n) { const vin = c.v.vinculos[k.id]; if (vin) { vin.proximidade = Math.min(100, vin.proximidade + 10); vin.presenca = Math.max(vin.presenca ?? 0, 40); vin.tUltimoContato = c.v.t; lembrarCom(c.v, k.id, `Você esteve perto depois que ${ele(k)} perdeu ${oLaco('genitor', c.p.falecido.genero)}.`, 'apoio', 2); } }
              if (!c.v.rotinas.some(r => r.id === 'tempo_familia')) c.v.rotinas.push({ id: 'tempo_familia', tInicio: c.v.t });
              const o = outroGenitor(c.v, c.p.falecido);
              if (o && c.v.vinculos[o.id]) { c.v.vinculos[o.id].proximidade = Math.min(100, c.v.vinculos[o.id].proximidade + 8); lembrarCom(c.v, o.id, `Você ajudou com as crianças depois de ${c.p.falecido.nome}.`, 'apoio', 2); }
            }
          };
        }
      },
      {
        id: 'distancia', texto: c => (outroGenitor(c.v, c.p.falecido) ? `Deixar que ${outroGenitor(c.v, c.p.falecido)!.nome} siga, e visitar quando der` : `Deixar que outra parte da família fique com ${netosDe(c.v, c.p.falecido).length === 1 ? netosDe(c.v, c.p.falecido)[0].nome : 'as crianças'}`),
        consequencia: c => { const n = netosDe(c.v, c.p.falecido); return `Sua rotina não muda; ${n.length === 1 ? `${n[0].nome} cresce` : 'as crianças crescem'} mais longe de você.`; },
        resolver: c => ({
          texto: 'Você manda mensagem nos aniversários e aparece no Natal.',
          memoria: null,
          efeito: () => { for (const k of netosDe(c.v, c.p.falecido)) { const vin = c.v.vinculos[k.id]; if (vin) vin.proximidade = Math.max(0, vin.proximidade - 6); } }
        })
      }
    ]
  },

  /* ======================================== O pai (ou a mãe) que ficou só */
  {
    id: 'rede_genitor_viuvo', tipo: 'decisao', idade: [18, 90], tema: 'familia', prioritario: true, prioridade: 5, repetir: 0,
    papeis: {
      viuvo: v => vinculosVivos(v).filter(x => (x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai') && !x.vin.convivio.includes('casa') && idadePessoa(v, x.p) >= 60
        && x.p.aperto?.tipo === 'luto' && x.p.aperto.pessoaId && lacoCom(v, x.p.id, x.p.aperto.pessoaId) === 'conjuge' && v.t - x.p.aperto.t >= 6 && v.t - x.p.aperto.t <= 24).map(x => x.p)
    },
    quando: c => !moraComFamiliaDeOrigem(c.v),
    titulo: c => `${c.p.viuvo.nome}, ${flex(c.p.viuvo.genero, 'viúvo', 'viúva', 'viúve')}`,
    texto: c => {
      const p = c.p.viuvo;
      const x = c.v.pessoas[p.aperto!.pessoaId!];
      const longe = p.municipioId !== c.v.moradia.municipioId;
      const irmaos = vinculosVivos(c.v).filter(k => (k.vin.parentesco === 'irmao') && k.p.municipioId === p.municipioId).map(k => k.p.nome);
      return `Desde que ${x?.nome ?? 'a parceria de uma vida'} morreu, ${flex(p.genero, 'seu pai', 'sua mãe', 'sue mãe')} ficou sozinh${flex(p.genero, 'o', 'a', 'e')} na casa de sempre${longe ? ', longe de você' : ''}, aos ${idadePessoa(c.v, p)} anos.${irmaos.length ? ` ${irmaos.join(' e ')} ${irmaos.length > 1 ? 'moram' : 'mora'} perto.` : ''}`;
    },
    opcoes: [
      {
        id: 'morar', texto: c => `Chamar ${c.p.viuvo.nome} para morar com você`, comportamento: { familia: 2 },
        consequencia: c => `${c.p.viuvo.nome} ${c.p.viuvo.municipioId !== c.v.moradia.municipioId ? 'se muda para a sua cidade e ' : ''}passa a morar na sua casa: companhia, e uma rotina que muda para todo mundo.`,
        resolver: c => {
          const p = c.p.viuvo;
          const vin = c.v.vinculos[p.id];
          const aceita = vin.proximidade >= 40 && vin.tensao < 45;
          return aceita
            ? {
              texto: `${p.nome} relutou uma semana e depois aceitou. Veio com duas malas e uma planta.`,
              memoria: `${p.nome} veio morar com você depois de ficar ${flex(p.genero, 'viúvo', 'viúva', 'viúve')}.`, relevancia: 'marco',
              efeito: () => { if (!vin.convivio.includes('casa')) vin.convivio.push('casa'); p.municipioId = c.v.moradia.municipioId; vin.proximidade = Math.min(100, vin.proximidade + 10); vin.tUltimoContato = c.v.t; lembrarCom(c.v, p.id, 'Veio morar com você depois da viuvez.', 'casa', 3); }
            }
            : {
              texto: `${p.nome} agradeceu e disse que não: "Essa casa é a minha vida." Você entendeu, mais ou menos.`,
              memoria: null,
              efeito: () => { vin.proximidade = Math.min(100, vin.proximidade + 4); vin.tUltimoContato = c.v.t; lembrarCom(c.v, p.id, 'Você ofereceu a sua casa depois da viuvez.', 'apoio', 2); }
            };
        }
      },
      {
        id: 'visitar', texto: c => (c.p.viuvo.municipioId !== c.v.moradia.municipioId ? `Visitar ${c.p.viuvo.nome} com mais frequência` : `Passar na casa de ${c.p.viuvo.nome} toda semana`), comportamento: { familia: 1 },
        consequencia: c => (c.p.viuvo.municipioId !== c.v.moradia.municipioId ? 'Viagens mais frequentes: tempo e passagem.' : 'Um pedaço da semana fica para isso.'),
        resolver: c => ({
          texto: `${c.p.viuvo.nome} começou a guardar o café para a hora em que você chega.`,
          memoria: `Passou a visitar ${c.p.viuvo.nome} com frequência depois da viuvez.`, relevancia: 'biografia',
          efeito: () => {
            const vin = c.v.vinculos[c.p.viuvo.id];
            vin.proximidade = Math.min(100, vin.proximidade + 8); vin.tUltimoContato = c.v.t;
            if (c.p.viuvo.municipioId !== c.v.moradia.municipioId) c.v.financas.conta -= 1200;
            if (!c.v.rotinas.some(r => r.id === 'tempo_familia')) c.v.rotinas.push({ id: 'tempo_familia', tInicio: c.v.t });
            lembrarCom(c.v, c.p.viuvo.id, 'Você passou a vir mais depois da viuvez.', 'apoio', 2);
            if (c.p.viuvo.aperto) c.p.viuvo.aperto.t -= 6;
          }
        })
      },
      {
        id: 'manter', texto: 'Manter as coisas como estão',
        consequencia: () => 'Nada muda na sua rotina.',
        resolver: c => ({ texto: `Vocês se falam por telefone. ${c.p.viuvo.nome} diz que está bem.`, memoria: null })
      }
    ]
  }
];

/** Os filhos pequenos de quem morreu (netos do jogador). */
function netosDe(v: Vida, x: Pessoa): Pessoa[] {
  return Object.values(v.pessoas).filter(n => n.vivo && n.genitores?.includes(x.id) && idadePessoa(v, n) < 18 && v.vinculos[n.id]?.parentesco === 'neto' && !v.vinculos[n.id].convivio.includes('casa'));
}

/** O outro genitor dos netos (vivo), se há. */
function outroGenitor(v: Vida, x: Pessoa): Pessoa | undefined {
  const n = netosDe(v, x)[0];
  const id = n ? paisDe(v, n.id).find(g => g !== x.id && g !== 'eu') : undefined;
  const p = id ? v.pessoas[id] : undefined;
  return p?.vivo ? p : undefined;
}
