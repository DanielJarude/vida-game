/**
 * VIDA 17 · MENSAGENS COM VIDA — o celular deixa de ser "a mesma frase com outro nome".
 *
 *   SITUAÇÕES     cada mensagem nasce de um motivo real: o aperto da pessoa (desabafo), a história dos dois (a
 *                 lembrança é lida do vínculo), um feito da SUA biografia (a comemoração), o seu aniversário, a sua fama,
 *                 o trabalho em comum, a família, um filho adulto, a mágoa guardada, o interesse de alguém (paquera).
 *   O JEITO       o temperamento de quem manda decide como fala (`catalogo17`: expansivo, contido, carinhoso, irônico).
 *   AS RESPOSTAS  de 3 a 5 por mensagem, de tons diferentes (apoio, conselho, evasiva, brincadeira, carinho, firmeza,
 *                 desculpas, agradecimento, recusa, interesse, desinteresse) — e consequências diferentes de verdade
 *                 (proximidade, confiança, tensão, romance, dinheiro, humor, a história dos dois).
 *   CONTINUIDADE  algumas respostas deixam um FIO (`Celular15.fios17`): a promessa de "outro dia" vira cobrança, o
 *                 apoio vira agradecimento, o favor vira retribuição, a resposta seca vira mágoa, o "eu também" da
 *                 paquera vira o convite para o encontro, a mensagem importante ignorada vira cobrança de resposta.
 *
 * Tudo isso entra pela MESMA porta das mensagens da VIDA 15 (`candidatos` → `entregar`) e respeita a cota global de
 * 4 mensagens recebidas por ano (`sistemas/cotaDeMensagens`). Mais variedade, não mais frequência.
 */
import type { Rng } from '../../rng';
import { clamp } from '../../rng';
import type { Marco, Pessoa, TipoMarco, Vida, Vinculo } from '../../tipos';
import { escrever, idade, idadePessoa, lembrarCom, parceiro, vinculosVivos } from '../../nucleo';
import { PERMITIDO, type Veredito } from '../../plausibilidade';
import { papelDe, type Papel } from '../../sistemas/vinculos';
import { acordoConsentido, interesseInicial, mudarEstagio, podeTerRomance } from '../../sistemas/romance';
import { registrarFase } from '../../sistemas/relacoes';
import { vereditoDePagar } from '../../sistemas/dinheiro';
import { flex } from '../../texto';
import { anoDe } from '../../tempo';
import { FALAS17, RESPOSTAS17, type Tom17 } from '../../dados17/celular/catalogo17';
import type { Msg15, TipoMsg15 } from '../../dados15/celular/tipos';
import type { Prioridade17 } from '../../sistemas/cotaDeMensagens';

/* ------------------------------------------------------------------ Leitura */

const humano = (p: Pessoa) => !p.especie && p.vivo && !!p.nome;
const moraJunto = (vin: Vinculo) => vin.convivio.includes('casa');
const oP = (p: Pessoa) => flex(p.genero, 'o', 'a', 'e');
const RECENTE = (v: Vida, chave: string, meses: number) => { const t = v.fatos[chave]; return t !== undefined && v.t - t < meses; };

/** O jeito de falar de cada pessoa (estável: sai do temperamento). Crianças falam como crianças (o catálogo cuida). */
export function tomDe(p: Pessoa): Tom17 {
  const t = p.temperamento;
  if (t.abertura > 0.25 && t.afabilidade < -0.05) return 'ironico';
  if (t.afabilidade > 0.3) return 'carinhoso';
  if (t.extroversao > 0.2) return 'expansivo';
  return 'contido';
}

/** Os tipos novos (os da VIDA 15 seguem lá). */
export const TIPOS17: TipoMsg15[] = ['desabafo', 'brincadeira', 'paquera', 'favor', 'cobranca', 'conflito', 'comemoracao', 'fama17', 'trabalho17', 'familia17', 'retomada'];
export const ehTipo17 = (t: TipoMsg15) => TIPOS17.includes(t);

/** Um fio de conversa que pode voltar (no máximo 40, os mais antigos saem). */
export interface Fio17 { pid: string; tipo: 'promessa' | 'apoio' | 'favor' | 'magoa' | 'paquera' | 'conflito' | 'sem_resposta'; t: number; dado?: string }

function fios(v: Vida): Fio17[] {
  const c = (v.celular15 ??= { ano: anoDe(v.t), msgs: [] });
  return (c.fios17 ??= []);
}

export function deixarFio17(v: Vida, f: Fio17): void {
  const lista = fios(v).filter(x => !(x.pid === f.pid && x.tipo === f.tipo));
  lista.push(f);
  v.celular15!.fios17 = lista.slice(-40);
}

/** As mensagens importantes que ficaram sem resposta viram fio (a pessoa pode cobrar depois). Chamado na virada. */
export function semResposta17(v: Vida, saindo: Msg15[]): void {
  for (const m of saindo) {
    if (m.resposta || !m.de) continue;
    if (m.tipo === 'desabafo' || m.tipo === 'conflito' || m.tipo === 'paquera' || (m.tipo === 'cobranca' && m.sit17 !== 'cobranca_resposta')) deixarFio17(v, { pid: m.de, tipo: 'sem_resposta', t: m.t, dado: m.tipo });
  }
}

function fala(sit: string, tom: Tom17, r: Rng, p: Pessoa | undefined, v: Vida, extra: Record<string, string> = {}): string {
  const f = FALAS17[sit];
  const lista = f[tom].length ? f[tom] : f.contido;
  let s = r.pick(lista);
  s = s.replace(/\{po\}/g, p ? oP(p) : 'o').replace(/\{o\}/g, flex(v.eu.genero, 'o', 'a', 'e')).replace(/\{eu\}/g, v.eu.nome).replace(/\{idade\}/g, String(idade(v)));
  for (const [k, val] of Object.entries(extra)) s = s.split(`{${k}}`).join(val);
  return s;
}

/** Uma lembrança real dos dois (o texto do marco, terminado em ponto). */
function lembranca(vin: Vinculo, r: Rng): string | undefined {
  const bons: TipoMarco[] = ['amizade', 'antigo', 'ritual', 'reconciliacao', 'apoio', 'presente'];
  const ms = vin.historia.filter((h: Marco) => h.tipo && bons.includes(h.tipo) && h.texto.length < 110);
  if (!ms.length) return undefined;
  const t = r.pick(ms).texto.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/** Um feito recente da SUA vida (a biografia), que alguém próximo pode ter visto. */
function feitoRecente(v: Vida): { id: string; texto: string } | undefined {
  for (let i = v.biografia.length - 1; i >= 0; i--) {
    const e = v.biografia[i];
    if (v.t - e.t > 12) break;
    if (e.relevancia !== 'biografia' || e.tom === 'ruim' || v.fatos[`cel17f_${e.id}`] !== undefined) continue;
    if (!['trabalho', 'estudo', 'casa', 'amor', 'filhos', 'escola'].includes(e.tema)) continue;
    if (/morr|demit|perd|separ|divórc|reprov|pres[oa]\b|conden|doen/i.test(e.texto)) continue;
    return { id: e.id, texto: /[.!?]$/.test(e.texto) ? e.texto : `${e.texto}.` };
  }
  return undefined;
}

/* ------------------------------------------------------------------ Os candidatos */

export interface Candidato17 { tipo: TipoMsg15; peso: number; p?: Pessoa; prioridade: Prioridade17; montar: (r: Rng) => Omit<Msg15, 'id' | 't' | 'tipo' | 'onda'> }

const PROXIMOS: Papel[] = ['amigo', 'amigo_proximo', 'irmao', 'parente'];

export function candidatos17(v: Vida, excluir: Set<string>, fama: number): Candidato17[] {
  const eu = idade(v);
  const out: Candidato17[] = [];
  const par = parceiro(v);
  const feito = eu >= 12 ? feitoRecente(v) : undefined;
  const aniv = !RECENTE(v, `cel17_aniv`, 12) && eu >= 6;

  // Os fios que voltam (a continuidade tem prioridade: é a vida da pessoa respondendo à sua).
  for (const f of [...fios(v)]) {
    const p = v.pessoas[f.pid];
    const vin = v.vinculos[f.pid];
    const dt = v.t - f.t;
    if (!p || !vin || !p.vivo || dt > 48) { v.celular15!.fios17 = fios(v).filter(x => x !== f); continue; }
    if (excluir.has(p.id) || vin.chamado) continue;
    const tom = tomDe(p);
    const tirar = () => { v.celular15!.fios17 = fios(v).filter(x => x !== f); };
    const sit = f.tipo === 'promessa' && dt >= 4 && vin.tUltimoContato <= f.t ? 'cobranca_promessa'
      : f.tipo === 'apoio' && dt >= 6 && !p.aperto ? 'retomada_agradecimento'
        : f.tipo === 'favor' && dt >= 4 ? 'retomada_retribuicao'
          : f.tipo === 'magoa' && dt >= 3 && vin.tensao >= 10 ? 'retomada_magoado'
            : f.tipo === 'conflito' && dt >= 6 && p.temperamento.afabilidade > -0.1 && vin.tensao < 60 ? 'retomada_reconciliacao'
              : f.tipo === 'paquera' && dt >= 1 && vin.romance?.estagio === 'interesse' ? 'paquera_segue'
                : f.tipo === 'sem_resposta' && dt >= 6 ? 'cobranca_resposta'
                  : undefined;
    if (!sit) continue;
    const tipo: TipoMsg15 = sit.startsWith('cobranca') ? 'cobranca' : sit === 'paquera_segue' ? 'paquera' : 'retomada';
    out.push({ tipo, p, prioridade: 'alta', peso: 2.2, montar: rr => { tirar(); return { de: p.id, sit17: sit, texto: fala(sit, tom, rr, p, v, { programa: f.dado ?? 'aquele programa' }), assunto: f.dado }; } });
  }

  for (const { p, vin } of vinculosVivos(v)) {
    if (!humano(p) || excluir.has(p.id) || vin.chamado) continue;
    if (RECENTE(v, `cel15_${p.id}`, 18)) continue;
    const papel = papelDe(p, vin);
    const ip = idadePessoa(v, p);
    const tom = tomDe(p);
    const rompido = !!vin.ruptura && vin.estagio !== 'ex_amigo';
    // Quem rompeu só volta pela reconexão, anos depois e sem guerra.
    if (vin.ruptura || papel === 'ex_amigo') {
      if (papel === 'ex_amigo' && vin.ruptura && v.t - vin.ruptura.t >= 36 && vin.tensao < 55 && eu >= 14 && ip >= 14 && !RECENTE(v, `cel17_recon_${p.id}`, 120)) {
        out.push({ tipo: 'conflito', p, prioridade: 'normal', peso: 0.5, montar: rr => { v.fatos[`cel17_recon_${p.id}`] = v.t; return { de: p.id, sit17: 'conflito_reconexao', texto: fala('conflito_reconexao', tom, rr, p, v) }; } });
      }
      if (rompido || papel === 'ex_amigo') continue;
    }
    if (vin.distancia !== undefined && v.t - vin.distancia < 48) continue;
    if (papel === 'pet' || papel === 'rival') continue;
    const proximo = PROXIMOS.includes(papel) && vin.proximidade >= 40;

    // Desabafo: quem confia em você conta o que está passando (o motivo é o estado real da pessoa).
    if (eu >= 15 && ip >= 15 && vin.confianca >= 45 && (proximo || papel === 'amigo_proximo' || (papel === 'filho' && ip >= 18)) && !moraJunto(vin)) {
      const ap = p.aperto && !p.aperto.resolvido && v.t - p.aperto.t <= 18 ? p.aperto : undefined;
      const sit = ap ? ({ separacao: 'desabafo_separacao', dinheiro: 'desabafo_dinheiro', desemprego: 'desabafo_trabalho', doenca: 'desabafo_saude', fase: 'desabafo_cansaco', luto: '' } as Record<string, string>)[ap.tipo]
        : p.parceiroId && p.vivo ? 'desabafo_amor' : p.ocupacao && ip >= 18 ? 'desabafo_trabalho' : vin.confianca >= 60 ? 'desabafo_familia' : 'desabafo_cansaco';
      if (sit) out.push({ tipo: 'desabafo', p, prioridade: ap ? 'alta' : 'normal', peso: (ap ? 1.3 : 0.45) + vin.confianca / 250, montar: rr => ({ de: p.id, sit17: sit, texto: fala(sit, tom, rr, p, v), assunto: ap?.tipo }) });
    }
    // Brincadeira: a amizade sem motivo (a lembrança é da história de vocês dois).
    if ((proximo || papel === 'amigo_proximo' || (papel === 'colega' && vin.proximidade >= 50)) && eu >= 7 && ip >= 7) {
      const marco = vin.historia.some(h => h.tipo === 'amizade' || h.tipo === 'antigo' || h.tipo === 'ritual');
      out.push({ tipo: 'brincadeira', p, prioridade: 'baixa', peso: 0.35 + Math.max(0, p.temperamento.extroversao) * 0.5 + (marco ? 0.2 : 0), montar: rr => {
        const lem = lembranca(vin, rr);
        const sit = eu < 13 && ip < 14 ? 'brincadeira_crianca' : lem && rr.chance(0.6) ? 'brincadeira_lembranca' : eu >= 14 && rr.chance(0.35) ? 'brincadeira_aposta' : 'brincadeira_meme';
        return { de: p.id, sit17: sit, texto: fala(sit, tom, rr, p, v, { marco: lem ?? '' }) };
      } });
    }
    // Paquera: alguém de fora da família, compatível, sem par, que se interessa por você.
    if (eu >= 14 && !vin.parentesco && (!vin.romance || vin.romance.estagio === 'interesse') && !RECENTE(v, `cel17_paq_${p.id}`, 36) && v.fatos[`cel17_semromance_${p.id}`] === undefined && podeTerRomance(v, p, vin)) {
      const int = interesseInicial(v, p);
      if (int >= 52) out.push({ tipo: 'paquera', p, prioridade: 'normal', peso: (0.25 + (int - 52) / 70) * (par ? 0.4 : 1), montar: rr => {
        v.fatos[`cel17_paq_${p.id}`] = v.t;
        const sit = eu < 18 ? 'paquera_adolescente' : 'paquera';
        return { de: p.id, sit17: sit, texto: fala(sit, tom, rr, p, v) };
      } });
    }
    // Favor: um pedido do dia a dia (a ajuda é sua para dar ou não).
    if ((proximo || papel === 'amigo_proximo' || (papel === 'colega' && vin.proximidade >= 45)) && eu >= 10 && ip >= 10 && !RECENTE(v, `cel17_favor_${p.id}`, 30)) {
      const ops = eu < 18 ? (ip < 19 ? ['favor_escola'] : []) : [...(ip >= 18 && ip <= 65 ? ['favor_mudanca'] : []), ...(ip >= 18 ? ['favor_pet'] : []), ...(ip >= 18 && (p.aperto?.tipo === 'desemprego' || ip <= 40) ? ['favor_curriculo'] : []), ...(v.financas.veiculoPrincipal ? ['favor_carona'] : [])];
      if (ops.length) out.push({ tipo: 'favor', p, prioridade: 'normal', peso: 0.4, montar: rr => { v.fatos[`cel17_favor_${p.id}`] = v.t; const sit = rr.pick(ops); return { de: p.id, sit17: sit, texto: fala(sit, tom, rr, p, v), assunto: sit }; } });
    }
    // Conflito: a mágoa guardada (o motivo é o do vínculo, nunca inventado); o ciúme da parceria tensa.
    const mg = vin.magoa && vin.magoa.quem === 'eu' && vin.magoa.ressentimento >= 30 ? vin.magoa : undefined;
    const cf = vin.conflito && vin.conflito.quem === 'eu' ? vin.conflito : undefined;
    if ((mg || cf) && eu >= 12 && ip >= 12 && !RECENTE(v, `cel17_conf_${p.id}`, 24)) {
      const assunto = (mg?.motivo ?? cf!.assunto).replace(/\.$/, '');
      out.push({ tipo: 'conflito', p, prioridade: 'alta', peso: 0.9, montar: rr => { v.fatos[`cel17_conf_${p.id}`] = v.t; return { de: p.id, sit17: 'conflito_magoa', texto: fala('conflito_magoa', tom, rr, p, v, { assunto }), assunto }; } });
    } else if (papel === 'parceiro' && vin.tensao >= 35 && !RECENTE(v, `cel17_conf_${p.id}`, 24)) {
      out.push({ tipo: 'conflito', p, prioridade: 'normal', peso: 0.5 + vin.tensao / 120, montar: rr => { v.fatos[`cel17_conf_${p.id}`] = v.t; return { de: p.id, sit17: 'conflito_ciume', texto: fala('conflito_ciume', tom, rr, p, v) }; } });
    }
    // Comemoração: alguém próximo soube do que aconteceu na SUA vida (o feito é lido da biografia).
    if (feito && (proximo || ['amigo_proximo', 'genitor', 'avo', 'irmao', 'filho'].includes(papel)) && ip >= 10) {
      out.push({ tipo: 'comemoracao', p, prioridade: 'normal', peso: 0.9, montar: rr => { v.fatos[`cel17f_${feito.id}`] = v.t; return { de: p.id, sit17: 'comemoracao_feito', texto: fala('comemoracao_feito', tom, rr, p, v, { feito: feito.texto.charAt(0).toLowerCase() + feito.texto.slice(1) }), cartao: feito.texto }; } });
    }
    // O seu aniversário (uma vez por ano, de quem é muito perto).
    if (aniv && (['genitor', 'avo', 'amigo_proximo', 'irmao', 'parceiro', 'filho'].includes(papel)) && ip >= 8 && vin.proximidade >= 50) {
      out.push({ tipo: 'comemoracao', p, prioridade: 'baixa', peso: 0.3, montar: rr => { v.fatos['cel17_aniv'] = v.t; return { de: p.id, sit17: 'aniversario', texto: fala('aniversario', tom, rr, p, v) }; } });
    }
    // A fama vista de perto: os amigos e a família comentam (e pedem).
    if (fama >= 1 && eu >= 14 && (proximo || papel === 'colega' || papel === 'amigo_proximo') && !RECENTE(v, 'cel17_fama', 24) && v.fatos['cel17_discreto'] === undefined) {
      out.push({ tipo: 'fama17', p, prioridade: 'baixa', peso: 0.35 + fama * 0.15, montar: rr => { v.fatos['cel17_fama'] = v.t; const sit = fama >= 2 && rr.chance(0.5) ? 'fama_pedido' : 'fama_amigo'; return { de: p.id, sit17: sit, texto: fala(sit, tom, rr, p, v) }; } });
    }
    // O trabalho em comum: o bastidor, a parceria num projeto, o crédito roubado.
    if (v.trabalho.atual && vin.convivio.includes('trabalho') && eu >= 18 && !RECENTE(v, 'cel17_trab', 18)) {
      out.push({ tipo: 'trabalho17', p, prioridade: 'normal', peso: 0.45, montar: rr => { v.fatos['cel17_trab'] = v.t; const sit = rr.pick(['trabalho_bastidor', 'trabalho_parceria', 'trabalho_credito']); return { de: p.id, sit17: sit, texto: fala(sit, tom, rr, p, v), assunto: sit }; } });
    }
    // A família de longe: a reunião de domingo, o conselho de quem criou você.
    if ((papel === 'genitor' || papel === 'avo' || (papel === 'irmao' && ip >= 18)) && eu >= 16 && !moraJunto(vin) && p.municipioId === v.moradia.municipioId && !RECENTE(v, 'cel17_fam', 18)) {
      out.push({ tipo: 'familia17', p, prioridade: 'normal', peso: 0.5, montar: rr => { v.fatos['cel17_fam'] = v.t; const sit = papel === 'irmao' || rr.chance(0.5) ? 'familia_reuniao' : 'familia_conselho'; return { de: p.id, sit17: sit, texto: fala(sit, tom, rr, p, v), assunto: sit }; } });
    } else if ((papel === 'genitor' || papel === 'avo') && eu >= 16 && !moraJunto(vin) && !RECENTE(v, 'cel17_fam', 18)) {
      out.push({ tipo: 'familia17', p, prioridade: 'normal', peso: 0.35, montar: rr => { v.fatos['cel17_fam'] = v.t; return { de: p.id, sit17: 'familia_conselho', texto: fala('familia_conselho', tom, rr, p, v), assunto: 'familia_conselho' }; } });
    }
    // O filho adulto: o pedido de ajuda com dinheiro, o carinho.
    if (papel === 'filho' && ip >= 18 && !moraJunto(vin) && !RECENTE(v, `cel17_filho_${p.id}`, 24)) {
      const pede = (p.aperto?.tipo === 'dinheiro' || p.aperto?.tipo === 'desemprego' || ip <= 28) && v.financas.conta > 1500;
      out.push({ tipo: 'familia17', p, prioridade: pede ? 'alta' : 'normal', peso: 0.5, montar: rr => {
        v.fatos[`cel17_filho_${p.id}`] = v.t;
        const valor = Math.round(clamp(v.financas.conta * 0.05, 300, 3000) / 50) * 50;
        return pede ? { de: p.id, sit17: 'filho_pedido', texto: fala('filho_pedido', tom, rr, p, v), assunto: 'filho_pedido', custo: valor } : { de: p.id, sit17: 'filho_carinho', texto: fala('filho_carinho', tom, rr, p, v), assunto: 'filho_carinho' };
      } });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ As respostas */

export interface OpcaoMsg17 { op: string; rotulo: string; veredito: Veredito }

const op = (o: string, rotulo: string, veredito: Veredito = PERMITIDO): OpcaoMsg17 => ({ op: o, rotulo, veredito });

/** As respostas das mensagens novas. Vazio: a mensagem só conta (nem toda mensagem pede escolha). */
export function opcoes17(v: Vida, m: Msg15): OpcaoMsg17[] {
  const sit = m.sit17 ?? '';
  const par = parceiro(v);
  const exclusivo = !!par && par.p.id !== m.de && !acordoConsentido(par.vin.romance);
  const pagar = (x: number | undefined, t: string) => (x ? vereditoDePagar(v, x, t) : PERMITIDO);
  if (sit.startsWith('desabafo')) return [
    op('apoio', 'Oferecer apoio de verdade'),
    op('conselho', 'Dar um conselho'),
    ...(sit === 'desabafo_dinheiro' || sit === 'desabafo_separacao' ? [op('ajudar', 'Oferecer ajuda com dinheiro', pagar(500, 'Ajudar custa uns'))] : []),
    op('engracada', 'Tentar arrancar uma risada'),
    op('evasiva', 'Responder por alto')];
  if (sit === 'brincadeira_aposta') return [op('provocar', 'Aceitar a aposta'), op('engracada', 'Rir e devolver a provocação'), op('evasiva', 'Deixar no visto')];
  if (sit.startsWith('brincadeira')) return [op('engracada', 'Rir junto'), op('carinhosa', 'Responder com carinho'), op('evasiva', 'Mandar só um emoji')];
  if (sit === 'paquera_segue') return [
    op('marcar', 'Marcar o encontro', exclusivo ? { grau: 'irregular', motivo: `Você está com ${par!.p.nome}.` } : pagar(120, 'O encontro custa uns')),
    op('adiar', 'Pedir mais um tempo'),
    op('desinteresse', 'Dizer que mudou de ideia')];
  if (sit.startsWith('paquera')) return [
    op('interesse', 'Demonstrar interesse', exclusivo ? { grau: 'irregular', motivo: `Você está com ${par!.p.nome}: pode dar problema.` } : PERMITIDO),
    op('devagar', 'Ir com calma, sem prometer nada'),
    op('engracada', 'Responder com flerte e brincadeira'),
    op('desinteresse', 'Dizer, com jeito, que não')];
  if (sit.startsWith('favor')) return [op('topar', 'Ajudar'), op('negociar', 'Ajudar em parte'), op('recusa', 'Dizer que não dá')];
  if (sit === 'cobranca_promessa') return [op('cumprir', 'Marcar agora, de verdade', pagar(80, 'O programa custa uns')), op('desculpas', 'Pedir desculpas'), op('engracada', 'Brincar para escapar'), op('firme', 'Ser sincero: não vai rolar')];
  if (sit === 'cobranca_resposta') return [op('desculpas', 'Pedir desculpas pelo silêncio'), op('firme', 'Explicar que precisava de espaço'), op('evasiva', 'Ignorar de novo')];
  if (sit === 'conflito_magoa') return [op('desculpas', 'Pedir desculpas'), op('firme', 'Explicar o seu lado'), op('confrontar', 'Rebater: você também errou'), op('evasiva', 'Deixar sem resposta')];
  if (sit === 'conflito_ciume') return [op('carinhosa', 'Tranquilizar com carinho'), op('firme', 'Pedir confiança, com firmeza'), op('engracada', 'Levar na brincadeira'), op('confrontar', 'Devolver a desconfiança')];
  if (sit === 'conflito_reconexao') return [op('aceitar', 'Aceitar conversar'), op('devagar', 'Responder com cautela'), op('firme', 'Dizer que prefere deixar como está')];
  if (sit === 'comemoracao_feito' || sit === 'aniversario') return [op('agradecimento', 'Agradecer'), op('carinhosa', 'Responder com carinho'), op('engracada', 'Responder brincando'), op('curto', 'Um "valeu" rápido')];
  if (sit === 'fama_amigo') return [op('carinhosa', 'Responder com humildade'), op('engracada', 'Brincar com a fama'), op('firme', 'Pedir para não misturar as coisas')];
  if (sit === 'fama_pedido') return [op('topar', 'Atender o pedido'), op('cache', 'Dizer que cobra cachê'), op('recusa', 'Recusar com educação')];
  if (sit === 'trabalho_parceria') return [op('topar', 'Topar o projeto'), op('recusa', 'Recusar: já está cheio')];
  if (sit === 'trabalho_credito') return [op('confrontar', 'Ir falar com a chefia'), op('apoio', 'Apoiar o colega'), op('evasiva', 'Deixar para lá')];
  if (sit === 'trabalho_bastidor') return [op('carinhosa', 'Agradecer o aviso'), op('engracada', 'Fazer piada da situação'), op('firme', 'Não entrar em fofoca')];
  if (sit === 'familia_reuniao') return [op('ir', 'Confirmar presença', pagar(60, 'Ir custa uns')), op('engracada', '"Só se tiver pudim"'), op('recusa', 'Inventar uma desculpa')];
  if (sit === 'familia_conselho' || sit === 'filho_carinho') return [op('carinhosa', 'Responder com carinho'), op('engracada', 'Responder brincando'), op('curto', 'Um "tá bom" rápido')];
  if (sit === 'filho_pedido') return [op('dar', 'Mandar o valor todo', pagar(m.custo, 'Custa')), op('parte', 'Mandar uma parte', pagar(Math.round((m.custo ?? 0) / 2), 'Custa')), op('firme', 'Negar, com uma conversa sobre dinheiro'), op('recusa', 'Negar sem explicação')];
  if (sit === 'retomada_magoado') return [op('desculpas', 'Pedir desculpas'), op('firme', 'Explicar o que quis dizer'), op('evasiva', 'Deixar quieto')];
  return [];
}

/** As respostas novas que se somam às mensagens antigas (VIDA 15): mais tons, outras consequências. */
export function extrasDaVida15(v: Vida, m: Msg15): OpcaoMsg17[] {
  switch (m.tipo) {
    case 'convite': return [op('engracada', 'Topar brincando: "só se tiver sobremesa"', m.custo ? vereditoDePagar(v, m.custo, 'O programa custa uns') : PERMITIDO), op('desinteresse', 'Dizer que não curte esse programa')];
    case 'saudade': return [op('carinhosa', 'Dizer que também sente falta'), op('evasiva', 'Responder por alto')];
    case 'noticia': return m.assunto && /^(desemprego|perda|saude)/.test(m.assunto) ? [op('evasiva', 'Responder por alto')] : [op('engracada', 'Comemorar brincando')];
    case 'ex': return [op('firme', 'Pedir para não procurar mais')];
    default: return [];
  }
}

const humor = (v: Vida, feliz: number, estresse = 0) => {
  v.mente.felicidade = clamp(Math.round(v.mente.felicidade + feliz));
  v.mente.estresse = clamp(Math.round(v.mente.estresse + estresse));
};
interface Efeito { prox?: number; conf?: number; tens?: number; rom?: number }
function mexer(v: Vida, vin: Vinculo | undefined, e: Efeito, contato = true): void {
  if (!vin) return;
  if (e.prox) vin.proximidade = clamp(Math.round(vin.proximidade + e.prox));
  if (e.conf) vin.confianca = clamp(Math.round(vin.confianca + e.conf));
  if (e.tens) vin.tensao = clamp(Math.round(vin.tensao + e.tens));
  if (e.rom && vin.romance) vin.romance.envolvimento = clamp(vin.romance.envolvimento + e.rom);
  if (contato) vin.tUltimoContato = v.t;
}

export interface Saida17 { texto: string; titulo?: string; pessoaId?: string; tom?: 'bom' | 'ruim' | 'neutro' }

/** A sua fala no balão (o tom da resposta escolhida). */
function suaFala(v: Vida, p: Pessoa | undefined, chave: string, r: Rng): string {
  const lista = RESPOSTAS17[chave];
  if (!lista) return '';
  return r.pick(lista).replace(/\{po\}/g, p ? oP(p) : 'o').replace(/\{o\}/g, flex(v.eu.genero, 'o', 'a', 'e')).replace(/^"|"$/g, '');
}

/**
 * Responde uma mensagem nova (ou uma resposta extra de uma mensagem antiga). Devolve `undefined` quando não é com
 * ela (a VIDA 15 responde as suas).
 */
export function responder17(v: Vida, r: Rng, m: Msg15, opc: string): Saida17 | undefined {
  const p = m.de ? v.pessoas[m.de] : undefined;
  const vin = m.de ? v.vinculos[m.de] : undefined;
  const nome = p?.nome ?? m.remetente ?? 'Alguém';
  const sit = m.sit17 ?? '';
  const t17 = ehTipo17(m.tipo);
  if (!t17 && !extrasDaVida15(v, m).some(x => x.op === opc)) return undefined;
  const brincalhao = !!p && (tomDe(p) === 'expansivo' || tomDe(p) === 'ironico');
  let texto = '';
  let tom: Saida17['tom'] = 'neutro';
  let falaChave = opc;
  const marcar = (txt: string, tipo: TipoMarco, peso = 1) => { if (p) lembrarCom(v, p.id, txt, tipo, peso); };

  /* --- Respostas extras das mensagens da VIDA 15. */
  if (!t17) {
    switch (`${m.tipo}:${opc}`) {
      case 'convite:engracada': {
        if (m.custo) v.financas.conta -= m.custo;
        mexer(v, vin, { prox: brincalhao ? 7 : 4, tens: -3 });
        humor(v, 4, -3);
        texto = brincalhao ? `${nome} respondeu "fechado, a sobremesa é minha!". O programa foi ótimo — e a sobremesa, melhor.` : `${nome} levou um segundo para entender a piada, mas riu. Saíram, e foi bom.`;
        falaChave = 'engracada'; tom = 'bom';
        if (p) marcar(`Saíram juntos depois de um convite pelo celular.`, 'amizade');
        break;
      }
      case 'convite:desinteresse':
        mexer(v, vin, { prox: -2 }, false);
        if (p) v.fatos[`cel17_semconvite_${p.id}`] = v.t;
        texto = `${nome} respondeu "ah, tá bom". Talvez demore para chamar de novo.`;
        falaChave = 'desinteresse'; break;
      case 'saudade:carinhosa':
        mexer(v, vin, { prox: 4, conf: 2 });
        humor(v, 2);
        texto = `${nome} mandou um áudio comprido. Deu para ouvir o sorriso.`; falaChave = 'carinhosa'; tom = 'bom'; break;
      case 'saudade:evasiva':
        mexer(v, vin, { prox: -2 }, false);
        if (p && r.chance(0.4)) deixarFio17(v, { pid: p.id, tipo: 'magoa', t: v.t });
        texto = `${nome} visualizou. A conversa parou ali.`; falaChave = 'evasiva'; break;
      case 'noticia:engracada':
        mexer(v, vin, { prox: 3 });
        humor(v, 1);
        texto = `${nome} respondeu com uma figurinha de dança. A comemoração foi pelo celular mesmo.`; falaChave = 'engracada'; tom = 'bom'; break;
      case 'noticia:evasiva':
        mexer(v, vin, { prox: -3, conf: -2 }, false);
        if (p) deixarFio17(v, { pid: p.id, tipo: 'magoa', t: v.t });
        texto = `"Ok." Foi o que ${nome} respondeu. Num momento difícil, "por alto" pesa.`; falaChave = 'evasiva'; tom = 'ruim'; break;
      case 'ex:firme':
        mexer(v, vin, { tens: 4 }, false);
        if (vin) vin.distancia = v.t;
        if (p) v.fatos[`cel15ex_${p.id}`] = v.t + 600;
        texto = `Você pediu, com todas as letras, para ${nome} não procurar mais. ${nome} respeitou.`; falaChave = 'firme'; break;
    }
    return fechar();
  }

  /* --- As mensagens novas. */
  if (sit.startsWith('desabafo')) {
    if (opc === 'apoio') { mexer(v, vin, { prox: 5, conf: 6 }); humor(v, 1, 1); marcar('Você ouviu e apoiou num momento difícil.', 'apoio'); if (p) deixarFio17(v, { pid: p.id, tipo: 'apoio', t: v.t }); texto = `A conversa foi longa. ${nome} terminou dizendo que se sentia mais leve.`; tom = 'bom'; }
    else if (opc === 'conselho') {
      if (p && p.temperamento.estabilidade < -0.2 && r.chance(0.4)) { mexer(v, vin, { tens: 4, conf: 1 }); texto = `${nome} respondeu "eu não pedi conselho, só queria desabafar". Faltou ouvir primeiro.`; tom = 'ruim'; }
      else { mexer(v, vin, { prox: 2, conf: 4 }); texto = `${nome} pensou no que você disse. "Faz sentido. Vou tentar."`; tom = 'bom'; }
    } else if (opc === 'ajudar') { v.financas.conta -= 500; mexer(v, vin, { prox: 7, conf: 10 }); marcar('Você ajudou com dinheiro numa hora apertada.', 'apoio', 2); if (p) deixarFio17(v, { pid: p.id, tipo: 'favor', t: v.t }); texto = `${nome} relutou, aceitou e chorou ao telefone. Prometeu devolver.`; tom = 'bom'; falaChave = 'apoio'; }
    else if (opc === 'engracada') {
      if (brincalhao) { mexer(v, vin, { prox: 3 }); humor(v, 1); texto = `${nome} riu pela primeira vez no dia. "Só você mesmo."`; tom = 'bom'; }
      else { mexer(v, vin, { tens: 5, conf: -2 }); if (p) deixarFio17(v, { pid: p.id, tipo: 'magoa', t: v.t }); texto = `${nome} não achou graça. "Tô falando sério."`; tom = 'ruim'; }
    } else { mexer(v, vin, { prox: -2, conf: -2 }, false); if (p && r.chance(0.5)) deixarFio17(v, { pid: p.id, tipo: 'magoa', t: v.t }); texto = `${nome} mandou um "tá bom" e não escreveu mais.`; }
  } else if (sit.startsWith('brincadeira')) {
    if (opc === 'provocar') { const ganhou = r.chance(0.5); const valor = r.int(30, 60); v.financas.conta += ganhou ? valor : -valor; mexer(v, vin, { prox: 3 }); humor(v, ganhou ? 3 : 1); texto = ganhou ? `Domingo chegou, e você ganhou. ${nome} pagou — reclamando, mas pagou.` : `Você perdeu. Pagou, e ainda ouviu a semana inteira.`; tom = ganhou ? 'bom' : 'neutro'; }
    else if (opc === 'engracada') { mexer(v, vin, { prox: 3 }); humor(v, 2); texto = `A conversa virou uma troca de figurinhas que durou a tarde.`; tom = 'bom'; }
    else if (opc === 'carinhosa') { mexer(v, vin, { prox: 2, conf: 2 }); texto = `${nome} respondeu com um coração. Às vezes é só isso.`; tom = 'bom'; }
    else { mexer(v, vin, { prox: -1 }, false); texto = `Um emoji. ${nome} parou de mandar.`; }
  } else if (sit.startsWith('paquera')) {
    const par = parceiro(v);
    const exclusivo = !!par && par.p.id !== m.de && !acordoConsentido(par.vin.romance);
    if (opc === 'interesse' || opc === 'marcar') {
      if (opc === 'marcar') v.financas.conta -= 120;
      if (p && vin) {
        if (opc === 'marcar' && podeTerRomance(v, p, vin)) { mudarEstagio(v, vin, 'saindo'); vin.romance!.envolvimento = clamp((vin.romance!.envolvimento ?? 55) + 6); marcar('O primeiro encontro, marcado por mensagem.', 'romance', 2); escrever(v, { texto: `Começou a sair com ${p.nome}.`, relevancia: 'biografia', tema: 'amor', escolha: true, pessoas: [p.id] }); texto = `O encontro foi melhor do que o esperado. Na volta, ${nome} mandou: "quando a gente repete?"`; }
        else { vin.romance = vin.romance ?? { estagio: 'interesse', tEstagio: v.t, envolvimento: 0 }; vin.romance.estagio = 'interesse'; vin.romance.tEstagio = v.t; vin.romance.envolvimento = Math.max(vin.romance.envolvimento, interesseInicial(v, p)); deixarFio17(v, { pid: p.id, tipo: 'paquera', t: v.t }); mexer(v, vin, { prox: 4 }); texto = `${nome} respondeu com três emojis e um "então tá combinado 😊".`; }
      }
      humor(v, 4);
      tom = 'bom';
      falaChave = opc === 'marcar' ? 'topar' : 'interesse';
      if (exclusivo && r.chance(0.3)) { par!.vin.tensao = clamp(par!.vin.tensao + 15); par!.vin.confianca = clamp(par!.vin.confianca - 8); lembrarCom(v, par!.p.id, `Viu as mensagens com ${nome}.`, 'conflito', 2); texto += ` Só que ${par!.p.nome} viu a conversa.`; tom = 'ruim'; }
    } else if (opc === 'devagar') { mexer(v, vin, { prox: 2 }); texto = `"Sem pressa", respondeu ${nome}. A porta ficou aberta.`; falaChave = 'evasiva'; }
    else if (opc === 'engracada') {
      if (p && r.chance(0.5) && vin) { vin.romance = vin.romance ?? { estagio: 'interesse', tEstagio: v.t, envolvimento: 0 }; vin.romance.envolvimento = Math.max(vin.romance.envolvimento, interesseInicial(v, p) - 5); mexer(v, vin, { prox: 3 }); texto = `O flerte rendeu. ${nome} respondeu à altura — e ninguém disse não.`; tom = 'bom'; }
      else { mexer(v, vin, { prox: 1 }); texto = `${nome} riu, mas ficou sem saber se era um sim.`; }
    } else if (opc === 'adiar') { if (p) deixarFio17(v, { pid: p.id, tipo: 'promessa', t: v.t, dado: 'aquele encontro' }); mexer(v, vin, { rom: -4 }); texto = `"Tudo bem, me avisa." O entusiasmo esfriou um pouco.`; falaChave = 'evasiva'; }
    else { if (vin && vin.romance?.estagio === 'interesse') vin.romance = undefined; if (p) v.fatos[`cel17_semromance_${p.id}`] = v.t; mexer(v, vin, { prox: -3, tens: p && p.temperamento.afabilidade < 0 ? 5 : 1 }, false); texto = p && p.temperamento.afabilidade < 0 ? `${nome} respondeu "ok, entendi" — e o clima entre vocês ficou estranho.` : `${nome} respondeu "obrigad${p ? oP(p) : 'o'} pela sinceridade". Ficou tudo bem.`; falaChave = 'desinteresse'; }
  } else if (sit.startsWith('favor')) {
    if (opc === 'topar') { humor(v, 1, 4); mexer(v, vin, { prox: 6, conf: 5 }); marcar('Você ajudou quando ' + (p ? 'precisou' : 'pediram') + '.', 'apoio'); if (p) deixarFio17(v, { pid: p.id, tipo: 'favor', t: v.t }); texto = `Deu trabalho — ${sit === 'favor_mudanca' ? 'a geladeira não passava na porta' : sit === 'favor_carona' ? 'acordar às 4h não é para qualquer um' : sit === 'favor_pet' ? 'o bicho escondeu um pé do seu sapato' : 'umas horas a menos no seu dia'} —, mas ${nome} não vai esquecer.`; tom = 'bom'; }
    else if (opc === 'negociar') { humor(v, 0, 2); mexer(v, vin, { prox: 3, conf: 2 }); texto = `Você ajudou no que deu. ${nome} agradeceu do mesmo jeito.`; falaChave = 'topar'; }
    else { mexer(v, vin, { prox: -3, tens: 3 }, false); texto = `${nome} entendeu. Ou disse que entendeu.`; }
  } else if (sit === 'cobranca_promessa') {
    if (opc === 'cumprir') { v.financas.conta -= 80; mexer(v, vin, { prox: 7, tens: -5, conf: 3 }); humor(v, 3, -2); marcar(`Cumpriu a promessa: ${m.assunto ?? 'o programa combinado'}.`, 'promessa'); texto = `Dessa vez saiu. E valeu a espera.`; tom = 'bom'; falaChave = 'topar'; }
    else if (opc === 'desculpas') { if (r.chance(0.3)) { mexer(v, vin, { tens: 3 }); if (p) deixarFio17(v, { pid: p.id, tipo: 'promessa', t: v.t, dado: m.assunto }); texto = `"Desculpa de novo?" ${nome} riu, mas não muito.`; } else { mexer(v, vin, { prox: 1, tens: -2 }); texto = `${nome} respondeu "tá desculpad${p ? oP(p) : 'o'}, mas vou cobrar".`; } }
    else if (opc === 'engracada') { if (brincalhao) { mexer(v, vin, { prox: 2 }); texto = `${nome} caiu na risada e deixou passar. Por enquanto.`; tom = 'bom'; } else { mexer(v, vin, { tens: 5 }); marcar('Uma promessa que ficou só na promessa.', 'promessa_quebrada'); texto = `${nome} não achou graça nenhuma.`; tom = 'ruim'; } }
    else { mexer(v, vin, { prox: -5, tens: 3, conf: 2 }); marcar('Uma promessa desfeita, com sinceridade.', 'promessa_quebrada'); texto = `"Pelo menos foi sincer${flex(v.eu.genero, 'o', 'a', 'e')}." Doeu um pouco nos dois.`; }
  } else if (sit === 'cobranca_resposta') {
    if (opc === 'desculpas') { mexer(v, vin, { prox: 2, tens: -5 }); texto = `${nome} aceitou. "Só não some de novo."`; tom = 'bom'; }
    else if (opc === 'firme') { if (p && p.temperamento.afabilidade > 0) { mexer(v, vin, { conf: 2 }); texto = `${nome} entendeu: todo mundo precisa de espaço às vezes.`; } else { mexer(v, vin, { tens: 4 }); texto = `${nome} respondeu "espaço, né? Ok." — e o ok veio gelado.`; } }
    else { mexer(v, vin, { prox: -6, tens: 6 }, false); if (vin && vin.proximidade < 30 && (vin.estagio === 'amigo' || vin.estagio === 'amigo_proximo')) { vin.estagio = 'afastado'; registrarFase(v, vin, 'afastado'); } texto = `Silêncio de novo. ${nome} entendeu o recado.`; tom = 'ruim'; }
  } else if (sit === 'conflito_magoa' || sit === 'retomada_magoado') {
    if (opc === 'desculpas') { mexer(v, vin, { tens: -14, conf: 4, prox: 2 }); if (vin?.magoa) vin.magoa.ressentimento = Math.max(0, vin.magoa.ressentimento - 30); if (vin?.conflito && vin.conflito.gravidade <= 2) vin.conflito = undefined; if (p) deixarFio17(v, { pid: p.id, tipo: 'conflito', t: v.t }); marcar('Você pediu desculpas pelo que magoou.', 'reconciliacao'); texto = `${nome} demorou a responder. Quando respondeu: "obrigad${p ? oP(p) : 'o'} por reconhecer."`; tom = 'bom'; }
    else if (opc === 'firme') { if (r.chance(0.5)) { mexer(v, vin, { tens: -5, conf: 2 }); texto = `${nome} ouviu o seu lado. Não concordou com tudo, mas entendeu.`; } else { mexer(v, vin, { tens: 5 }); texto = `${nome} achou que você estava se justificando. A conversa travou.`; tom = 'ruim'; } if (p) deixarFio17(v, { pid: p.id, tipo: 'conflito', t: v.t }); }
    else if (opc === 'confrontar') { mexer(v, vin, { tens: 12, conf: -4, prox: -3 }); marcar('Uma discussão feia por mensagem.', 'conflito'); if (vin && vin.tensao >= 75 && r.chance(0.35)) { vin.distancia = v.t; texto = `A discussão escalou. ${nome} parou de falar com você.`; } else texto = `Os dois disseram coisas duras. Ficou pior.`; tom = 'ruim'; }
    else { mexer(v, vin, { tens: 6, prox: -2 }, false); texto = `Você deixou sem resposta. A mágoa ficou onde estava.`; tom = 'ruim'; }
  } else if (sit === 'conflito_ciume') {
    if (opc === 'carinhosa') { mexer(v, vin, { tens: -8, conf: 3, rom: 2 }); texto = `${nome} respondeu "desculpa, acho que eu precisava ouvir isso". À noite, tudo estava mais leve.`; tom = 'bom'; }
    else if (opc === 'firme') { if (p && p.temperamento.estabilidade > 0) { mexer(v, vin, { tens: -3, conf: 2 }); texto = `${nome} pensou e concordou: confiança é a base.`; } else { mexer(v, vin, { tens: 6, rom: -2 }); texto = `${nome} achou que você estava fugindo do assunto.`; tom = 'ruim'; } }
    else if (opc === 'engracada') { if (brincalhao && vin && vin.tensao < 50) { mexer(v, vin, { tens: -5 }); texto = `${nome} riu e mandou "bob${p ? oP(p) : 'o'}". Passou.`; tom = 'bom'; } else { mexer(v, vin, { tens: 8 }); texto = `${nome} não estava brincando.`; tom = 'ruim'; } }
    else { mexer(v, vin, { tens: 14, conf: -6, rom: -4 }); marcar('Uma briga de ciúme por mensagem.', 'conflito', 2); texto = `A conversa virou briga. Dormiram sem se falar.`; tom = 'ruim'; }
  } else if (sit === 'conflito_reconexao') {
    if (opc === 'aceitar') { if (vin) { vin.ruptura = undefined; vin.estagio = 'afastado'; vin.reconciliacao = v.t; registrarFase(v, vin, 'reconciliacao'); } mexer(v, vin, { tens: -20, prox: 8, conf: 4 }); marcar('Voltaram a se falar, anos depois da briga.', 'reconciliacao', 2); escrever(v, { texto: `Fez as pazes com ${nome}, anos depois.`, relevancia: 'biografia', tema: 'amizade', escolha: true, pessoas: p ? [p.id] : undefined }); texto = `Conversaram por horas. Não resolveu tudo, mas abriu a porta.`; tom = 'bom'; falaChave = 'topar'; }
    else if (opc === 'devagar') { mexer(v, vin, { tens: -8 }); texto = `Você respondeu com cuidado. ${nome} entendeu: aos poucos.`; falaChave = 'evasiva'; }
    else { if (p) v.fatos[`cel17_recon_${p.id}`] = v.t + 120; texto = `${nome} respondeu "entendo. Fica bem." E foi isso.`; }
  } else if (sit === 'comemoracao_feito' || sit === 'aniversario') {
    if (opc === 'agradecimento') { mexer(v, vin, { prox: 3 }); humor(v, 2); texto = `${nome} respondeu "você merece!".`; tom = 'bom'; }
    else if (opc === 'carinhosa') { mexer(v, vin, { prox: 4, conf: 2 }); humor(v, 3); texto = `Virou uma conversa boa, das compridas.`; tom = 'bom'; }
    else if (opc === 'engracada') { mexer(v, vin, { prox: brincalhao ? 4 : 2 }); humor(v, 2); texto = brincalhao ? `${nome} devolveu a piada à altura. Riram os dois.` : `${nome} mandou um "kkkk" educado.`; tom = 'bom'; }
    else { mexer(v, vin, { prox: 1 }); texto = `${nome} curtiu a mensagem.`; }
  } else if (sit === 'fama_amigo') {
    if (opc === 'carinhosa') { mexer(v, vin, { prox: 4, conf: 2 }); texto = `"Continua a mesma pessoa", respondeu ${nome}. Era o melhor elogio.`; tom = 'bom'; }
    else if (opc === 'engracada') { mexer(v, vin, { prox: 3 }); humor(v, 2); texto = `${nome} riu: "metid${flex(v.eu.genero, 'o', 'a', 'e')}". Do jeito bom.`; tom = 'bom'; }
    else { v.fatos['cel17_discreto'] = v.t; mexer(v, vin, { prox: -3 }); texto = `${nome} entendeu. Ficou um pouco sem graça.`; }
  } else if (sit === 'fama_pedido') {
    if (opc === 'topar') { mexer(v, vin, { prox: 4, conf: 2 }); humor(v, 1, 1); contarReacao(v, 'fa_atendido'); texto = `Você atendeu. ${nome} mandou o vídeo da reação — valeu a pena.`; tom = 'bom'; }
    else if (opc === 'cache') { const valor = r.int(2, 8) * 100; v.financas.conta += valor; mexer(v, vin, { prox: -5, tens: 3 }); texto = `${nome} pagou ${valor.toLocaleString('pt-BR')}. E nunca mais pediu nada.`; falaChave = 'firme'; }
    else { mexer(v, vin, { prox: -2 }, false); texto = `${nome} disse "sem problemas" e mudou de assunto.`; }
  } else if (sit.startsWith('trabalho')) {
    const emp = v.trabalho.atual as { desempenho?: number } | undefined;
    const desemp = (n: number) => { if (emp && typeof emp.desempenho === 'number') emp.desempenho = clamp(emp.desempenho + n); };
    if (sit === 'trabalho_parceria' && opc === 'topar') { desemp(5); humor(v, 1, 4); mexer(v, vin, { prox: 4, conf: 3 }); marcar('Fizeram um projeto juntos.', 'trabalho'); texto = `O projeto deu trabalho e deu certo. A chefia notou os dois.`; tom = 'bom'; }
    else if (opc === 'confrontar') { if (r.chance(0.45)) { desemp(6); humor(v, 3, 2); texto = `Você foi falar com a chefia, com os fatos na mão. O crédito voltou para quem fez.`; tom = 'bom'; } else { desemp(-4); humor(v, -2, 6); texto = `A chefia não gostou do tom. O crédito ficou onde estava — e o clima, pior.`; tom = 'ruim'; } mexer(v, vin, { prox: 3, conf: 3 }); falaChave = 'firme'; }
    else if (opc === 'apoio') { mexer(v, vin, { prox: 4, conf: 4 }); texto = `${nome} agradeceu: "pelo menos alguém viu."`; tom = 'bom'; }
    else if (opc === 'carinhosa') { mexer(v, vin, { prox: 2, conf: 2 }); texto = `"De nada. A gente se protege", respondeu ${nome}.`; tom = 'bom'; falaChave = 'agradecimento'; }
    else if (opc === 'engracada') { mexer(v, vin, { prox: 3 }); humor(v, 1, -1); texto = `A piada rodou o grupo do setor inteiro. Deu uma aliviada no dia.`; tom = 'bom'; }
    else if (opc === 'firme') { mexer(v, vin, { conf: 3, prox: -1 }); texto = `${nome} respeitou. Fama de discreto no trabalho vale mais do que parece.`; }
    else { mexer(v, vin, { prox: -2 }, false); humor(v, 0, 1); texto = sit === 'trabalho_credito' ? `Você deixou para lá. ${nome} ficou sozinh${p ? oP(p) : 'o'} na revolta.` : `${nome} entendeu.`; }
  } else if (sit === 'familia_reuniao') {
    if (opc === 'ir') { v.financas.conta -= 60; mexer(v, vin, { prox: 5, tens: -3 }); humor(v, 3, -2); marcar('Um almoço de família, todo mundo junto.', 'ritual'); texto = `Teve comida demais, conversa alta e foto de todo mundo no fim.`; tom = 'bom'; falaChave = 'topar'; }
    else if (opc === 'engracada') { mexer(v, vin, { prox: 3 }); texto = `"Tem pudim!", veio a resposta. Você foi — e comeu dois pedaços.`; humor(v, 2); tom = 'bom'; }
    else { mexer(v, vin, { prox: -3, tens: 2 }, false); texto = `${nome} respondeu "tá bom". Na foto do almoço, faltava você.`; falaChave = 'recusa'; }
  } else if (sit === 'familia_conselho' || sit === 'filho_carinho') {
    if (opc === 'carinhosa') { mexer(v, vin, { prox: 4, conf: 2 }); humor(v, 2); texto = `${nome} respondeu com um coração e um "te amo".`; tom = 'bom'; }
    else if (opc === 'engracada') { mexer(v, vin, { prox: 2 }); texto = `${nome} mandou "engraçadinh${flex(v.eu.genero, 'o', 'a', 'e')}" com três risadas.`; tom = 'bom'; }
    else { mexer(v, vin, { prox: -1 }); texto = `"Tá bom." A conversa terminou ali.`; }
  } else if (sit === 'filho_pedido') {
    const valor = m.custo ?? 0;
    if (opc === 'dar') { v.financas.conta -= valor; mexer(v, vin, { prox: 5, conf: 3 }); marcar('Você ajudou com dinheiro quando foi preciso.', 'apoio'); texto = `${nome} agradeceu muito. "Assim que der, eu devolvo."`; tom = 'bom'; falaChave = 'apoio'; }
    else if (opc === 'parte') { v.financas.conta -= Math.round(valor / 2); mexer(v, vin, { prox: 2, conf: 1 }); texto = `${nome} agradeceu: ajudava, mesmo não sendo tudo.`; falaChave = 'topar'; }
    else if (opc === 'firme') { mexer(v, vin, { prox: -2, conf: r.chance(0.5) ? 3 : -2 }); texto = r.chance(0.5) ? `${nome} ficou chatead${p ? oP(p) : 'o'}, mas depois disse que a conversa ajudou a se organizar.` : `${nome} respondeu "ok" — sem ânimo para sermão.`; }
    else { mexer(v, vin, { prox: -6, tens: 5 }, false); marcar('Pediu ajuda e ouviu um não seco.', 'abandono'); texto = `${nome} não respondeu mais naquele mês.`; tom = 'ruim'; }
  }
  return fechar();

  function fechar(): Saida17 {
    const minha = suaFala(v, p, falaChave, r);
    m.resposta = { op: opc, t: v.t, texto, ...(minha ? { fala: minha } : {}) };
    m.lida = true;
    return { texto, titulo: nome, pessoaId: p?.id, tom };
  }
}

function contarReacao(v: Vida, id: string): void {
  const f = (v.fama13 ??= {});
  const re = (f.reacoes ??= {});
  re[id] = (re[id] ?? 0) + 1;
}

/** As mensagens que só contam (agradecimento, retribuição, reconciliação): o efeito acontece quando chegam. */
export function aoChegar17(v: Vida, m: Msg15): void {
  const vin = m.de ? v.vinculos[m.de] : undefined;
  if (!vin) return;
  if (m.sit17 === 'retomada_agradecimento') { vin.confianca = clamp(vin.confianca + 3); vin.proximidade = clamp(vin.proximidade + 2); humor(v, 2); }
  if (m.sit17 === 'retomada_retribuicao') { vin.proximidade = clamp(vin.proximidade + 3); humor(v, 2); lembrarCom(v, m.de!, 'Retribuiu uma ajuda antiga.', 'presente'); }
  if (m.sit17 === 'retomada_reconciliacao') { vin.tensao = clamp(vin.tensao - 10); vin.proximidade = clamp(vin.proximidade + 2); lembrarCom(v, m.de!, 'Fizeram as pazes por mensagem.', 'reconciliacao'); }
}
