/**
 * VIDA 15 · A INTERRUPÇÃO DA GRAVIDEZ, PELA LEI DE ONDE SE VIVE. Entra como opções da decisão que já existe ("Fora dos
 * planos", `conteudo/sistemicos`): continuar a gravidez segue como sempre (contar, esconder); interromper depende do país
 * (e, nos EUA, do estado) — `dados15/saude/aborto`:
 *   · onde é legal a pedido (dentro do prazo), pelo sistema público ou particular;
 *   · onde só os permissivos valem, a opção legal aparece SÓ quando o caso se enquadra (menor de 14 no Brasil é estupro de
 *     vulnerável pela lei; risco à saúde/vida pela saúde da gestante) — nunca presumido;
 *   · onde não é legal: viajar para onde é (custa, e nem todos podem), ou fazer fora da lei (risco à saúde e o risco de a
 *     coisa vir à tona: fica como segredo, que o sistema de exposição já sabe fazer vazar). Nenhuma consequência automática
 *     igual para todos: o que pesa é a lei do lugar, o dinheiro, a idade, a saúde.
 * Quando quem gesta é a outra pessoa, a decisão é dela: você pode conversar; ela decide (pelo que ela quer da vida).
 */
import type { Ctx, Opcao } from '../../conteudo/base';
import type { Vida } from '../../tipos';
import { clamp } from '../../rng';
import { gestacaoEmCurso } from '../../sistemas/familia';
import { municipio } from '../../dados/lugares';
import { idade, idadePessoa, lembrarCom } from '../../nucleo';
import { flex } from '../../texto';
import { vereditoDePagar } from '../../sistemas/dinheiro';
import { podeTentar } from '../../plausibilidade';
import { EUA_PROIBIDO15, EUA_SEIS_SEMANAS15, LEIS_DO_ABORTO15, type LeiDoAborto15 } from '../../dados15/saude/aborto';

/** A lei que vale para a vida (o país da cidade; nos EUA, o estado). */
export function leiDoAborto15(v: Vida): LeiDoAborto15 {
  const m = municipio(v.moradia.municipioId);
  if (m.pais === 'US') {
    if (EUA_PROIBIDO15.has(m.uf)) return { regime: 'permissivos', permissivos: ['risco_vida'], publico: false, lei: 'Neste estado americano, é proibido desde a queda de Roe v. Wade (2022), salvo risco à vida', pena: 'é crime para quem faz o procedimento' };
    if (EUA_SEIS_SEMANAS15.has(m.uf)) return { regime: 'pedido', semanas: 6, publico: false, lei: 'Neste estado americano, só é legal até as 6 semanas — antes de muita gente saber que está grávida', permissivos: ['risco_vida'] };
    return { regime: 'pedido', semanas: 24, publico: false, lei: 'Neste estado americano, é legal (a lei estadual protege o acesso)', permissivos: ['risco_vida', 'risco_saude', 'anomalia', 'estupro'] };
  }
  return LEIS_DO_ABORTO15[m.pais] ?? { regime: 'permissivos', permissivos: ['risco_vida'], publico: true, lei: 'Aqui, só é permitido quando a vida da gestante corre risco', pena: 'é crime fora desse caso' };
}

interface Situacao { gestante: 'eu' | string; semanas: number; idadeG: number; saudeG: number }

function situacao(v: Vida): Situacao | undefined {
  const g = gestacaoEmCurso(v);
  if (!g) return undefined;
  const ela = g.gestanteId === 'eu' ? undefined : v.pessoas[g.gestanteId];
  return {
    gestante: g.gestanteId,
    semanas: Math.max(5, Math.round((v.t - g.tConcepcao) * 4.3)),
    idadeG: ela ? idadePessoa(v, ela) : idade(v),
    saudeG: ela ? ela.saude : v.corpo.saude
  };
}

/** Pode ser feito legalmente aqui, agora? Com o porquê (o prazo, o permissivo que se aplica). */
export function legalAqui15(v: Vida): { pode: boolean; porque: string } {
  const l = leiDoAborto15(v);
  const s = situacao(v);
  if (!s) return { pode: false, porque: '' };
  const m = municipio(v.moradia.municipioId);
  if ((l.regime === 'pedido' || l.regime === 'aconselhamento') && s.semanas <= (l.semanas ?? 0)) return { pode: true, porque: l.lei };
  const per = l.permissivos ?? [];
  if (per.includes('estupro') && s.idadeG < 14 && m.pais === 'BR') return { pode: true, porque: 'Pela lei, toda gravidez antes dos 14 anos é de estupro de vulnerável: o acesso é legal' };
  if (per.includes('risco_vida') && s.saudeG < 30) return { pode: true, porque: 'Com a saúde da gestante em risco, a lei permite' };
  if (per.includes('risco_saude') && (s.saudeG < 42 || s.idadeG < 15 || s.idadeG > 44)) return { pode: true, porque: 'Pelo risco à saúde da gestante, a lei permite' };
  return { pode: false, porque: l.regime === 'proibido' || l.regime === 'permissivos' ? `${l.lei}: fora desses casos, ${l.pena ?? 'é crime'}.` : `${l.lei} — e o prazo já passou.` };
}

const custoLocal = (v: Vida, x: number) => Math.round(x * (municipio(v.moradia.municipioId).pais === 'BR' ? 1 : 1.4));

function encerrar(c: Ctx): void {
  const g = gestacaoEmCurso(c.v);
  if (!g) return;
  c.v.processos = c.v.processos.filter(p => p.id !== g.id);
  c.v.fatos[`interrompeu15_${g.id}`] = c.v.t;
  // A outra pessoa (quando há e quis o filho) sente; quando foi decisão a dois, aproxima.
  const outro = g.gestanteId === 'eu' ? g.outroId : g.gestanteId;
  const p = outro ? c.v.pessoas[outro] : undefined;
  const vin = outro ? c.v.vinculos[outro] : undefined;
  if (p && vin) {
    if (p.querFilhos === 'sim' && g.gestanteId === 'eu') { vin.tensao = clamp(vin.tensao + 12); lembrarCom(c.v, p.id, 'A gravidez interrompida: doeu nos dois de um jeito diferente.', 'conflito', 1); }
    else { vin.confianca = clamp(vin.confianca + 3); lembrarCom(c.v, p.id, 'Uma decisão difícil, tomada juntos.', 'apoio', 1); }
  }
}

const humor = (c: Ctx, f: number, e: number) => { c.v.mente.felicidade = clamp(c.v.mente.felicidade + f); c.v.mente.estresse = clamp(c.v.mente.estresse + e); };

/** Quando é a outra pessoa quem gesta: ela decide (pelo que ela quer da vida). */
function elaDecide(c: Ctx): boolean {
  const g = gestacaoEmCurso(c.v);
  if (!g || g.gestanteId === 'eu') return true;
  const p = c.v.pessoas[g.gestanteId];
  const q = p?.querFilhos === 'nao' ? 0.85 : p?.querFilhos === 'talvez' ? 0.5 : 0.15;
  return c.r.chance(q);
}

/** As opções de interromper (somadas às de continuar da decisão "Fora dos planos"). */
export const opcoesDoAborto15: Opcao[] = [
  {
    id: 'interromper_legal',
    texto: c => (gestacaoEmCurso(c.v)?.gestanteId === 'eu' ? 'Interromper a gravidez (aqui é legal)' : 'Conversar sobre interromper (aqui é legal)'),
    disponivel: c => (legalAqui15(c.v).pode ? true : false),
    consequencia: c => `${legalAqui15(c.v).porque}.${leiDoAborto15(c.v).publico ? ' Pela rede pública, sem custo.' : ` No particular, uns ${custoLocal(c.v, 2500).toLocaleString('pt-BR')}.`}`,
    resolver: c => {
      if (!elaDecide(c)) { humor(c, -2, 6); return { texto: `${c.v.pessoas[gestacaoEmCurso(c.v)!.gestanteId]?.nome ?? 'A outra pessoa'} ouviu, pensou — e decidiu seguir com a gravidez. A decisão era dela.`, memoria: null }; }
      const l = leiDoAborto15(c.v);
      if (!l.publico) c.v.financas.conta -= custoLocal(c.v, 2500);
      humor(c, -3, 9);
      encerrar(c);
      return { texto: l.regime === 'aconselhamento' ? 'Primeiro o aconselhamento obrigatório, três dias de espera, depois o procedimento. Foi rápido. O que ficou foi o silêncio do caminho de volta.' : 'Uma consulta, um procedimento seguro, um atestado de dois dias. O corpo se recuperou logo; o resto, cada um no seu tempo.', memoria: 'Decidiu interromper uma gravidez.', relevancia: 'biografia', tom: 'neutro' };
    }
  },
  {
    id: 'interromper_fora',
    texto: c => (municipio(c.v.moradia.municipioId).pais === 'US' ? 'Ir a outro estado onde é legal' : 'Viajar para interromper onde é legal'),
    disponivel: c => {
      if (legalAqui15(c.v).pode || !gestacaoEmCurso(c.v)) return false;
      if (idade(c.v) < 16) return 'Sem idade (nem dinheiro) para viajar por conta própria.';
      const x = vereditoDePagar(c.v, custoLocal(c.v, municipio(c.v.moradia.municipioId).pais === 'US' ? 2200 : 7000), 'A viagem e o procedimento custam uns');
      return podeTentar(x) ? true : x.motivo ?? 'Não há esse dinheiro.';
    },
    consequencia: c => `${legalAqui15(c.v).porque} Fora daqui, é legal — mas custa a viagem e o procedimento.`,
    resolver: c => {
      if (!elaDecide(c)) { humor(c, -2, 6); return { texto: 'A conversa foi longa. No fim, a decisão foi seguir com a gravidez — e a decisão era dela.', memoria: null }; }
      c.v.financas.conta -= custoLocal(c.v, municipio(c.v.moradia.municipioId).pais === 'US' ? 2200 : 7000);
      humor(c, -4, 14);
      encerrar(c);
      return { texto: 'Passagem, hotel, uma clínica do outro lado da fronteira. Tudo legal lá — e tudo escondido aqui. Voltar foi o mais pesado.', memoria: 'Viajou para interromper uma gravidez onde era legal.', relevancia: 'biografia', tom: 'neutro' };
    }
  },
  {
    id: 'interromper_clandestino',
    texto: c => (gestacaoEmCurso(c.v)?.gestanteId === 'eu' ? 'Interromper fora da lei' : 'Apoiar se for interrompida fora da lei'),
    disponivel: c => (legalAqui15(c.v).pode || !gestacaoEmCurso(c.v) ? false : true),
    consequencia: c => `Aqui, ${leiDoAborto15(c.v).pena ?? 'é crime'}. Fora da lei, não há garantia de segurança — e pode vir à tona.`,
    resolver: c => {
      if (!elaDecide(c)) { humor(c, -2, 6); return { texto: 'No fim, a decisão foi não arriscar: a gravidez segue. A decisão era dela.', memoria: null }; }
      const g = gestacaoEmCurso(c.v)!;
      const eu = g.gestanteId === 'eu';
      encerrar(c);
      humor(c, -6, 18);
      // O risco de saúde é real (e maior onde é crime: sem rede, sem garantia). O de vir à tona, também.
      const complicou = c.r.chance(0.22);
      if (complicou) {
        if (eu) c.v.corpo.saude = clamp(c.v.corpo.saude - c.r.int(12, 30));
        else { const p = c.v.pessoas[g.gestanteId]; if (p) p.saude = clamp(p.saude - c.r.int(12, 30)); }
      }
      (c.v.segredos ??= []).push({ id: `ab15_${g.id}`, tipo: 'ilicito', t: c.v.t, quemSabe: [eu ? g.outroId : g.gestanteId].filter((x): x is string => !!x) });
      const quem = eu ? 'você' : c.v.pessoas[g.gestanteId]?.nome ?? 'ela';
      return {
        texto: complicou ? `Foi feito às escondidas. Dias depois veio a febre, a dor, o pronto-socorro — ${eu ? 'você contou meia verdade ao médico' : `${quem} contou meia verdade ao médico`}. Passou. O medo, não tão cedo.` : 'Foi feito às escondidas, com medo de tudo: de dar errado, de alguém saber. Deu certo. Ninguém soube — por enquanto.',
        memoria: 'Interrompeu uma gravidez fora da lei.', relevancia: 'biografia', tom: 'ruim'
      };
    }
  }
];

/** Para a tela e os testes: a lei dita numa frase (com o gênero de quem lê, quando precisa). */
export function fraseDaLei15(v: Vida): string {
  const l = leiDoAborto15(v);
  return `${l.lei}${l.pena ? `; fora disso, ${l.pena}` : ''}.`.replace(/\.\.$/, '.') + (idade(v) < 18 ? ` ${flex(v.eu.genero, 'Menor', 'Menor', 'Menor')} de idade, a família pesa na decisão.` : '');
}
