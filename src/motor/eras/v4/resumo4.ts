/**
 * ERAS v4 · O QUE A TELA DA SOCIEDADE MOSTRA — lido do estado, sem conta na tela (`ui/eras/Sociedade4`).
 * O lugar de origem e o que ele pesa na época; as barreiras que pesam agora (com a natureza e a fonte); os movimentos
 * na rua (com o risco e as ações); os partidos do mês; e o mundo que esta continuidade mudou.
 */
import type { Vida } from '../../tipos';
import { anoDe } from '../../tempo';
import { municipio } from '../../dados/lugares';
import { paisHistoricoCorrente, mesHistoricoCorrente, ladoHistoricoCorrente } from '../base/moedas';
import {
  barreirasQuePesam, classeNaFaculdade, nivelDeOrigem, partidosDaEpocaDoPais, partidoAtivoNoMes, partidoUnicoNoAno,
  redeDeOrigem, reformaPorId, taxaDoSuperior, type DominioDaBarreira, type NaturezaDaBarreira
} from '../base/sociedade4';
import { SOCIEDADE_BR } from '../base/sociedadeBR';
import { PARTIDOS_BR_NO_TEMPO, existeNoMes } from '../base/partidos';
import { disponibilidadeEras4, movimentosDaVida, palavraDoRisco, type OqueEras4 } from './movimentos4';
import { reformasDoMandato } from './politica4';
import { podeTentar } from '../../plausibilidade';

export interface ResumoDaSociedade {
  ano: number;
  origem: { rotulo: string; frase: string };
  barreiras: { id: string; dominio: DominioDaBarreira; natureza: NaturezaDaBarreira; texto: string; alternativa?: string; fonte: string; residual: boolean; ate?: number; bloqueia: boolean }[];
  movimentos: { id: string; nome: string; causa: string; risco: string; nivel: number; papel?: string; pressao: number; reformas: string[]; acoes: { oque: OqueEras4; rotulo: string; pode: boolean; motivo?: string }[] }[];
  partidos: { id: string; nome: string; linha?: string; unico: boolean }[];
  reformasDoCargo: string[];
  mudancas: { ano: number; nome: string; onde: string; quem: string; antes?: number; derrubada?: { ano: number; porQue?: string } }[];
}

const ROTULO_CLASSE = ['família pobre', 'família trabalhadora', 'família de classe média baixa', 'família de classe média', 'família rica e de nome'];
const DOMINIO_ROTULO: Record<DominioDaBarreira, string> = { trabalho: 'Trabalho', salario: 'Salário', estudo: 'Estudo', credito: 'Crédito', politica: 'Política' };
export const rotuloDoDominio = (d: DominioDaBarreira) => DOMINIO_ROTULO[d];
export const rotuloDaNatureza = (n: NaturezaDaBarreira) => (n === 'lei' ? 'Lei' : n === 'instituicao' ? 'Prática das instituições' : 'Costume');

function fraseDaOrigem(v: Vida, ano: number, pais: string): string {
  const n = nivelDeOrigem(v);
  const taxa = taxaDoSuperior(pais, ano);
  const rede = redeDeOrigem(v, 3), facul = classeNaFaculdade(v);
  const quantos = taxa !== undefined ? `Em ${ano}, ${Math.max(1, Math.round(taxa))} em cada cem jovens chegavam ao ensino superior no país. ` : '';
  if (n >= 4) return `${quantos}O sobrenome e os contatos da família ${rede > 1.15 ? 'abrem as portas dos postos altos' : 'ajudam, mas já não decidem tudo'}; a escola paga e o ano sem trabalhar estão ao alcance.`;
  if (n === 3) return `${quantos}A família tem algum nome e algum dinheiro: a escola secundária está ao alcance, e um conhecido aqui e ali ajuda.`;
  if (n === 2) return `${quantos}A família se sustenta, sem sobra: estudar mais exige escolha${facul < 0.85 ? ' — e quase sempre trabalhar junto' : ''}.`;
  return `${quantos}Na sua casa, o dinheiro é contado: ${facul < 0.6 ? 'a universidade é para poucos, e os postos altos pedem um conhecido que vocês não têm' : 'estudar mais é possível, mas pesa no orçamento'}. Subir é possível — custa mais.`;
}

export function resumoDaSociedade(v: Vida): ResumoDaSociedade | undefined {
  const t = mesHistoricoCorrente();
  if (!v.era || t === null) return undefined;
  const ano = anoDe(v.t);
  const pais = paisHistoricoCorrente();
  const dominios: DominioDaBarreira[] = ['trabalho', 'salario', 'estudo', 'credito', 'politica'];
  const vistos = new Set<string>();
  const barreiras = dominios.flatMap(d => barreirasQuePesam(v, d)).filter(p => !vistos.has(p.barreira.id) && (vistos.add(p.barreira.id), true)).map(p => ({
    id: p.barreira.id, dominio: p.barreira.dominio, natureza: p.barreira.natureza, texto: p.barreira.texto, alternativa: p.barreira.alternativa,
    fonte: p.barreira.fonte, residual: p.residual, ate: p.barreira.ate, bloqueia: p.bloqueia
  }));
  const movimentos = movimentosDaVida(v).map(x => ({
    id: x.m.id, nome: x.m.nome, causa: x.m.causa, risco: palavraDoRisco(x.risco), nivel: x.risco, papel: x.papel, pressao: x.pressao, reformas: x.reformas,
    acoes: (['participar', 'organizar', 'financiar', 'sair'] as OqueEras4[]).filter(o => o !== 'sair' || !!x.papel).map(o => {
      const vd = disponibilidadeEras4(v, o, x.m.id);
      return { oque: o, rotulo: o === 'participar' ? (x.papel ? 'Ir às reuniões e às marchas' : 'Participar') : o === 'organizar' ? 'Organizar' : o === 'financiar' ? 'Dar dinheiro' : 'Afastar-se', pode: podeTentar(vd), motivo: vd.motivo };
    })
  }));
  const div = municipio(v.moradia.municipioId).uf;
  const lado = ladoHistoricoCorrente();
  const partidos = pais === 'BR'
    ? [...(SOCIEDADE_BR.partidos ?? []).filter(p => partidoAtivoNoMes(p, t, div)).map(p => ({ id: p.id, nome: p.nome, linha: p.linha, unico: false })),
      ...PARTIDOS_BR_NO_TEMPO.filter(p => existeNoMes(p, t)).map(p => ({ id: p.id, nome: p.nome, linha: undefined, unico: false }))]
    : partidosDaEpocaDoPais(pais).filter(p => partidoAtivoNoMes(p, t, div, lado)).map(p => ({ id: p.id, nome: p.nome, linha: p.linha, unico: partidoUnicoNoAno(p, ano) }));
  const mudancas = (v.era.historia?.alteracoes ?? []).map(a => {
    const r = reformaPorId(a.pais, a.reforma);
    const onde = a.alcance === 'nacional' ? 'no país' : a.alcance === 'estadual' ? `no estado (${a.divisao ?? '—'})` : `em ${a.municipioId ? municipio(a.municipioId).nome : 'uma cidade'}`;
    const nome = (r?.nome ?? a.reforma).replace(/ no estado$/, '').replace(/ na cidade$/, '');
    return { ano: anoDe(a.t), nome, onde, quem: a.por === 'voce' ? (a.autor === v.eu.nome ? 'você' : a.autor ?? 'a família') : a.autor ?? 'um movimento', antes: a.antes, ...(a.revogadaEm !== undefined ? { derrubada: { ano: anoDe(a.revogadaEm), porQue: a.porQue } } : {}) };
  });
  return {
    ano, origem: { rotulo: ROTULO_CLASSE[nivelDeOrigem(v)], frase: fraseDaOrigem(v, ano, pais) },
    barreiras, movimentos, partidos: ano <= 2025 ? partidos : [], reformasDoCargo: reformasDoMandato(v).map(r => r.nome), mudancas
  };
}
