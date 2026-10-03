/**
 * Ofícios vivos: a base comum das carreiras "normais".
 *
 * Conseguir a profissão não basta — é preciso vivê-la. Advogado, dentista,
 * professor, enfermeiro, engenheiro, contador, jornalista, médico,
 * psicólogo e programador compartilham a MESMA infraestrutura:
 *
 *   ÁREA — depois de uns anos, a pessoa escolhe onde vai se aprofundar
 *   (`Emprego.especialidade`, que vai junto para o próximo emprego);
 *   DESAFIO — o caso, a turma, a obra, a pauta que aparece: encarar pode dar
 *   certo (feitos, desempenho, clientela, promoção) ou não (cabeça, clima);
 *   CONTA PRÓPRIA — quem juntou estrada e nome pode sair para atender por
 *   conta (autônomo: a própria agenda, sem empresa);
 *   VIRAR DONO — o autônomo cheio de clientes pode montar a empresa
 *   (consultório, escritório, com equipe): outra trajetória, outro risco.
 *
 * Cada profissão só troca as PALAVRAS (`OFICIOS`); a mecânica é uma só.
 */

import type { Conteudo, Ctx, Opcao } from './base';
import { clamp } from '../rng';
import type { Emprego } from '../tipos';
import { escrever, idade, marcarFato } from '../nucleo';
import { estresse } from './efeitos';
import { ocupacao, ocupacaoOuNula } from '../dados/ocupacoes';
import { NEGOCIOS } from '../dados/negocios';
import { contratar, elegibilidade } from '../sistemas/trabalho';
import { podeTentar } from '../plausibilidade';
import { abalar } from '../sistemas/abalo';
import { marcar } from '../sistemas/marcas';
import { mexerNoClima, temChefia } from '../sistemas/profissao';
import { negocioAberto } from '../sistemas/negocio';

import { OFICIOS } from '../sistemas/oficios';
import { areaAtual, chaveDoOficio, escolherArea, fasesDaArea } from '../sistemas/areasDoOficio';
import { areaProfissional } from '../dados/areasProfissionais';
import { rngDe } from '../rng';

const oficioDe = (e?: Emprego) => (e ? OFICIOS[ocupacaoOuNula(e.ocupacaoId)?.trilha ?? ''] : undefined);
const emprego = (c: Ctx) => c.v.trabalho.atual!;
const anosNaTrilha = (c: Ctx) => (c.v.trabalho.experiencia[ocupacao(emprego(c).ocupacaoId).trilha] ?? 0) / 12;
const vivo = (c: Ctx) => { const e = c.v.trabalho.atual; return !!e && !e.formacaoAte && e.contrato !== 'estagio' && e.contrato !== 'aprendiz' && !!oficioDe(e); };

/** A chance de o desafio dar certo: estrada, como vem indo, a área, a cabeça. */
function chanceDoDesafio(c: Ctx): number {
  const e = emprego(c);
  return clamp(0.35 + Math.min(10, anosNaTrilha(c)) * 0.03 + (e.desempenho - 55) / 100 + (e.especialidade ? 0.1 : 0) + (c.v.mente.cognicao - 50) / 200 - Math.max(0, c.v.mente.estresse - 70) / 100, 0.12, 0.85);
}

/** O desafio da vez (estável entre abrir e resolver: sai do ano). */
const indiceDesafio = (c: Ctx) => { const o = oficioDe(emprego(c))!; return Math.floor(c.v.t / 12) % o.desafios.length; };
/**
 * O caso grande da vez: o do ofício, ou — um ano sim, outro não, para quem tem área — o caso com a cara da área
 * (`dados/areasProfissionais`): Segurança tem invasão; Dados, o modelo que errou; Produto, o lançamento.
 */
function desafioDaVez(c: Ctx): { texto: string; encarar: string; passar: string; deu: string; naoDeu: string } {
  const o = oficioDe(emprego(c))!;
  const d = o.desafios[indiceDesafio(c)];
  const daArea = areaProfissional(emprego(c).especialidade)?.desafio;
  if (daArea && Math.floor(c.v.t / 12) % 2 === 0) return { ...d, ...daArea };
  return { ...d, texto: d.texto(emprego(c).especialidade) };
}
const chave = (c: Ctx) => chaveDoOficio(ocupacao(emprego(c).ocupacaoId).trilha);
/** A área para onde dá para migrar (estável no ano: a primeira das outras, girando com o tempo). */
function novaArea(c: Ctx): string | undefined {
  const o = oficioDe(emprego(c))!; const a = areaAtual(c.v, chave(c));
  const outras = o.areas.filter(x => x !== a && !fasesDaArea(c.v, chave(c)!).some(f => f.area === x));
  return outras.length ? outras[Math.floor(c.v.t / 12) % outras.length] : undefined;
}

export const OFICIOS_CONTEUDO: Conteudo[] = [
  {
    // REWORK 4: a primeira escolha da área é UM marco da carreira. Elegível só enquanto a pessoa não tem área NAQUELE
    // ofício (`areasDoOficio`: da pessoa, não do emprego — sobrevive a troca de emprego, promoção, demissão, mudança de
    // país, save/reload). Quem escolheu nunca mais vê esta pergunta; mudar de área é outra decisão (`ofi_area_troca`).
    id: 'ofi_area', tipo: 'decisao', idade: [23, 70], tema: 'trabalho', prioritario: true, prioridade: 2, repetir: 0,
    quando: c => vivo(c) && !emprego(c).especialidade && !areaAtual(c.v, chave(c)) && oficioDe(emprego(c))!.areas.length > 0 && anosNaTrilha(c) >= 2 && (c.v.fatos['ofi_generalista'] === undefined || c.v.t - c.v.fatos['ofi_generalista'] >= 60) && c.r.chance(0.5),
    titulo: 'A área',
    texto: c => (c.v.fatos['ofi_generalista'] !== undefined ? `Faz anos que você segue generalista. ${oficioDe(emprego(c))!.area.replace(/^Depois de [^,]+, /, 'Mas ').replace(/^(.)/, x => x.toUpperCase())}` : oficioDe(emprego(c))!.area),
    opcoes: [...[0, 1, 2, 3].map((k): Opcao => ({
      id: `a${k}`,
      texto: (c: Ctx) => { const a = oficioDe(emprego(c))!.areas[k]; return a.charAt(0).toUpperCase() + a.slice(1); },
      disponivel: (c: Ctx) => (oficioDe(emprego(c))!.areas[k] ? true : false),
      // Cada área diz o que é e o que muda (`dados/areasProfissionais`) — não a mesma frase para todas.
      consequencia: (c: Ctx) => { const a = areaProfissional(oficioDe(emprego(c))!.areas[k]); return a ? `${a.descricao} ${a.muda}` : 'Os desafios dessa área rendem mais — e ela vai junto para o próximo emprego.'; },
      resolver: (c: Ctx) => { const a = oficioDe(emprego(c))!.areas[k]; return { texto: `Você decidiu: ${a}. Os primeiros cursos vieram no mesmo ano.`, memoria: `Escolheu se aprofundar em ${a}.`, relevancia: 'biografia', efeito: () => { escolherArea(c.v, chave(c)!, a); const e = emprego(c); e.desempenho = clamp(e.desempenho + 4); if (e.clientela === undefined) e.salario = Math.round(e.salario * (areaProfissional(a)?.salario ?? 1) / 10) * 10; } }; }
    })), { id: 'geral', texto: () => 'Seguir generalista, por enquanto', disponivel: () => true, consequencia: () => 'Nada muda agora. Daqui a uns anos, a pergunta pode voltar — com a estrada de generalista na conta.', resolver: (c: Ctx) => ({ texto: 'Você preferiu não se prender a uma área só.', memoria: null, efeito: () => { c.v.fatos['ofi_generalista'] = c.v.t; } }) }]
  },
  {
    // Mudar de área depois de anos numa: OUTRA decisão, com consequência própria. A fase anterior fecha, não some —
    // "generalista → Segurança → anos depois, Dados" fica no currículo e na Linha da Vida.
    id: 'ofi_area_troca', tipo: 'decisao', idade: [27, 66], tema: 'trabalho', prioritario: true, prioridade: 1, repetir: 8,
    quando: c => { if (!vivo(c)) return false; const k = chave(c); const a = areaAtual(c.v, k); if (!a || !k) return false; const f = fasesDaArea(c.v, k); const desde = f[f.length - 1].tInicio; return c.v.t - desde >= 60 && !!novaArea(c) && rngDe(c.v.id, 'troca_area', c.v.t).chance(0.14); },
    titulo: 'Outra área',
    texto: c => { const k = chave(c)!; const a = areaAtual(c.v, k)!; const f = fasesDaArea(c.v, k); const anos = Math.max(1, Math.round((c.v.t - f[f.length - 1].tInicio) / 12)); return `Depois de ${anos} anos em ${a}, surgiu a oportunidade de migrar para ${novaArea(c)}. ${areaProfissional(novaArea(c))?.descricao ?? ''}`; },
    opcoes: [
      { id: 'migrar', texto: c => `Migrar para ${novaArea(c)}`, comportamento: { coragem: 1 },
        consequencia: c => `${areaProfissional(novaArea(c))?.muda ?? ''} O começo é de aprendiz de novo: o desempenho cai um pouco antes de subir. O que você sabe de ${areaAtual(c.v, chave(c))} não se perde.`.trim(),
        resolver: c => { const de = areaAtual(c.v, chave(c))!; const para = novaArea(c)!; const k = chave(c)!; const f = fasesDaArea(c.v, k); const anos = Math.max(1, Math.round((c.v.t - f[f.length - 1].tInicio) / 12)); return { texto: `Você topou. Na primeira semana, voltou a se sentir ${c.g('novato', 'novata', 'novate')}.`, memoria: `Depois de ${anos} anos em ${de}, migrou para ${para}.`, relevancia: 'biografia', efeito: () => { escolherArea(c.v, k, para); const e = emprego(c); e.desempenho = clamp(e.desempenho - 6); marcar(c.v, 'mudanca_carreira', `Migrou de ${de} para ${para}.`, 2); } }; } },
      { id: 'ficar', texto: c => `Continuar em ${areaAtual(c.v, chave(c))}`, consequencia: () => 'A área de sempre, com a estrada de sempre.',
        resolver: () => ({ texto: 'Você agradeceu e ficou onde já é referência.', memoria: null }) }
    ]
  },
  {
    // O trabalho também acontece: de dois em dois anos, mais ou menos, aparece o caso, a turma, a obra, a pauta.
    id: 'ofi_desafio', tipo: 'decisao', idade: [22, 75], tema: 'trabalho', prioritario: true, prioridade: 1, repetir: 2,
    quando: c => vivo(c) && anosNaTrilha(c) >= 1 && c.r.chance(0.45),
    titulo: 'No trabalho',
    texto: c => desafioDaVez(c).texto,
    opcoes: [
      { id: 'encarar', texto: c => oficioDe(emprego(c))!.desafios[indiceDesafio(c)].encarar, comportamento: { coragem: 1 },
        consequencia: c => { const x = chanceDoDesafio(c); return `${x >= 0.6 ? 'Você tem estrada para isso' : x >= 0.4 ? 'Pode dar certo — ou não' : 'É arriscado para quem está onde você está'}. Mais trabalho no ano.`; },
        resolver: c => {
          const d = desafioDaVez(c);
          const deu = c.r.chance(chanceDoDesafio(c));
          const g = (s: string) => s.replace('{o}', c.g('o', 'a', 'e'));
          return {
            texto: g(deu ? d.deu : d.naoDeu), memoria: deu && (emprego(c).feitos ?? 0) === 0 ? `O primeiro grande ${/caso|paciente/.test(d.texto) ? 'caso' : 'trabalho'} de verdade como ${ocupacao(emprego(c).ocupacaoId).nome[0]}: deu certo.` : null, relevancia: deu ? 'biografia' : undefined, tom: deu ? 'bom' : 'ruim',
            efeito: () => {
              const e = emprego(c);
              estresse(c, 4);
              if (deu) {
                e.feitos = (e.feitos ?? 0) + 1;
                e.desempenho = clamp(e.desempenho + 10);
                if (e.clientela !== undefined) e.clientela = clamp(e.clientela + 10);
                if (temChefia(c.v)) mexerNoClima(c.v, 6);
                abalar(c.v, 'o trabalho que deu certo', 4, -2);
                if ((e.feitos ?? 0) === 3) marcar(c.v, 'conquista', `Virou referência como ${ocupacao(e.ocupacaoId).nome[0]}${e.especialidade ? ` (${e.especialidade})` : ''}.`, 2);
              } else {
                e.desempenho = clamp(e.desempenho - 6);
                if (e.clientela !== undefined) e.clientela = clamp(e.clientela - 5);
                abalar(c.v, 'o trabalho que não deu certo', -3, 5);
              }
            }
          };
        } },
      { id: 'passar', texto: c => oficioDe(emprego(c))!.desafios[indiceDesafio(c)].passar,
        consequencia: () => 'Nada arriscado — e nada construído.',
        resolver: c => ({ texto: 'Você deixou passar. A semana seguiu igual.', memoria: null, efeito: () => { if (temChefia(c.v)) mexerNoClima(c.v, -2); } }) }
    ]
  },
  {
    // Com estrada e nome, dá para sair e atender por conta: sem chefe, sem salário fixo — a agenda é sua.
    id: 'ofi_conta_propria', tipo: 'decisao', idade: [25, 65], tema: 'trabalho', prioritario: true, prioridade: 1, repetir: 6,
    quando: c => c.r.chance(0.25) && (() => { const e = c.v.trabalho.atual; const o = oficioDe(e); if (!e || !o?.contaPropria || e.contrato !== 'clt' || !vivo(c)) return false; const alvo = ocupacaoOuNula(o.contaPropria); return !!alvo && anosNaTrilha(c) >= 4 && ((e.feitos ?? 0) >= 1 || anosNaTrilha(c) >= 7) && podeTentar(elegibilidade(c.v, alvo)); })(),
    titulo: 'Por conta própria',
    texto: c => `Dois clientes antigos disseram que iriam com você se você atendesse por conta. ${(emprego(c).feitos ?? 0) >= 2 ? 'O seu nome já circula.' : ''} Sair é trocar o salário pela agenda: o que entra depende de quem vem.`,
    opcoes: [
      { id: 'sair', texto: 'Sair e atender por conta', comportamento: { coragem: 1, independencia: 1 },
        consequencia: () => 'Sem salário fixo, sem chefe, sem empresa: você é o seu trabalho. A freguesia começa pequena.',
        resolver: c => ({ texto: 'Você pediu as contas e mandou mensagem para os clientes antigos.', memoria: `Saiu do emprego para trabalhar por conta.`, relevancia: 'marco', efeito: () => { const o = oficioDe(emprego(c))!; const feitos = emprego(c).feitos ?? 0; const esp = emprego(c).especialidade; const novo = contratar(c.v, c.r, ocupacao(o.contaPropria!), 'conta_propria'); novo.especialidade = esp; if (novo.clientela !== undefined) novo.clientela = clamp(novo.clientela + feitos * 6 + 8); marcar(c.v, 'mudanca_carreira', 'Passou a trabalhar por conta.', 2); } }) },
      { id: 'ficar', texto: 'Ficar no emprego', resolver: () => ({ texto: 'Você agradeceu. O salário do mês que vem tem data.', memoria: null }) }
    ]
  },
  {
    // O autônomo cheio de clientes pode virar DONO: a empresa, a equipe, as contas — outra vida, não uma promoção.
    id: 'ofi_virar_dono', tipo: 'decisao', idade: [27, 68], tema: 'trabalho', prioritario: true, prioridade: 1, repetir: 5,
    quando: c => c.r.chance(0.3) && (() => { const e = c.v.trabalho.atual; const o = oficioDe(e); return !!e && !!o?.negocio && e.clientela !== undefined && e.clientela >= 62 && !negocioAberto(c.v) && idade(c.v) >= 27 && NEGOCIOS.some(n => n.id === o.negocio); })(),
    titulo: 'A agenda não cabe',
    texto: c => { const t = NEGOCIOS.find(n => n.id === oficioDe(emprego(c))!.negocio)!; return `A agenda lota três semanas adiante. Um colega sugere: por que não ${t.nome.replace(/^um /, 'montar um ').replace(/^uma /, 'montar uma ')}, com gente trabalhando junto? Hoje você atende por conta; lá, seria ${c.g('o dono', 'a dona', 'e done')} — com equipe, aluguel e folha.`; },
    opcoes: [
      { id: 'abrir', texto: 'Pensar seriamente em abrir', consequencia: () => 'Abre a conversa do negócio: quanto custa, de onde vem o dinheiro. Nada é assinado ainda.',
        resolver: c => { const t = oficioDe(emprego(c))!.negocio!; return { texto: 'Você sentou com uma planilha e um café.', memoria: null, abrir: { id: 'neg_abrir' }, efeito: () => { c.v.fatos['abrir_tipo'] = Math.max(0, NEGOCIOS.findIndex(n => n.id === t)); marcarFato(c.v, 'pensou_negocio_proprio'); } }; } },
      { id: 'nao', texto: 'Continuar atendendo por conta', resolver: () => ({ texto: 'Você preferiu a agenda cheia sem folha de pagamento.', memoria: null }) }
    ]
  }
];

void escrever;
