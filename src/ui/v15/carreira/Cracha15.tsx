/**
 * VIDA 15 · O CRACHÁ DA CARREIRA — o topo de Caminhos · Trabalho com a cara do ofício: a ficha do atleta (clube, posição,
 * a temporada, os números da carreira, os títulos), o jaleco do médico (instituição, especialidade), o cartão do
 * empresário (as empresas, a parte, o papel), o do político (partido, mandato, a trajetória nas urnas), o currículo do
 * artista (os trabalhos e o que repercutiu) — ou o crachá do emprego. Só LÊ o que os sistemas já guardam; nada novo.
 */
import type { Vida } from '../../../motor/tipos';
import { anoDe } from '../../../motor/tempo';
import { idade } from '../../../motor/nucleo';
import { ocupacaoOuNula } from '../../../motor/dados/ocupacoes';
import { especialidadeMedica } from '../../../motor/sistemas/medicina';
import { leituraDoPalmares } from '../../../motor/sistemas/palmares';
import { flex } from '../../../motor/texto';
import { dinheiroCurto } from '../../apresentar';

const CARGO: Record<string, [string, string]> = {
  vereador: ['Vereador', 'Vereadora'], prefeito: ['Prefeito', 'Prefeita'], deputado_estadual: ['Deputado estadual', 'Deputada estadual'],
  deputado_federal: ['Deputado federal', 'Deputada federal'], senador: ['Senador', 'Senadora'], governador: ['Governador', 'Governadora'], presidente: ['Presidente', 'Presidenta']
};
const POS: Record<string, string> = { goleiro: 'Goleiro', lateral: 'Lateral', zagueiro: 'Zagueiro', volante: 'Volante', meia: 'Meia', ponta: 'Ponta', atacante: 'Atacante' };
const ESPEC: Record<string, string> = { clinica: 'Clínica médica', pediatria: 'Pediatria', cirurgia: 'Cirurgia', psiquiatria: 'Psiquiatria', familia: 'Medicina de família' };
const PAPEL_EMP: Record<string, string> = { dono: 'Dono', socio: 'Sócio', investidor: 'Investidor' };

interface Linha { r: string; v: string }
interface Cracha { tipo: string; selo: string; titulo: string; sub?: string; dados: Linha[]; lista?: { titulo: string; itens: string[] } }

function lerCracha(v: Vida): Cracha | undefined {
  const g = v.eu.genero;
  const fem = g === 'feminino' ? 1 : 0;
  const e = v.caminhos.esporte;
  if (e && e.fase !== 'encerrada') {
    const ult = e.temporadas?.[e.temporadas.length - 1];
    const tot = e.totais;
    const pal = leituraDoPalmares(v);
    return {
      tipo: 'atleta', selo: e.fase === 'base' ? 'Categoria de base' : 'Atleta profissional', titulo: e.clube,
      sub: [e.posicao ? POS[e.posicao] : undefined, e.espaco === 'titular' ? 'titular' : e.espaco === 'reserva' ? 'reserva' : undefined, e.contratoAte ? `contrato até ${anoDe(e.contratoAte)}` : undefined].filter(Boolean).join(' · '),
      dados: [
        ...(ult ? [{ r: `Temporada ${ult.ano}`, v: `${ult.partidas} jogos · ${ult.gols} gols · ${ult.assistencias} assist.` }] : []),
        ...(tot ? [{ r: 'Na carreira', v: `${tot.partidas} jogos · ${tot.gols} gols · ${tot.temporadas} temporadas` }] : []),
        ...(e.transferencias?.length ? [{ r: 'Clubes', v: String(new Set([...e.transferencias.map(x => x.para), e.clube]).size) }] : [])
      ],
      lista: pal.titulos.length ? { titulo: 'Títulos', itens: pal.titulos.slice(-4).reverse() } : undefined
    };
  }
  const pol = v.caminhos.politica;
  if (pol?.mandato || (pol && (pol.fase === 'filiado' || pol.fase === 'candidato' || pol.fase === 'entre_mandatos'))) {
    const m = pol.mandato;
    const eleicoes = pol.historico.filter(h => h.resultado === 'eleito').length;
    return {
      tipo: 'politico', selo: m ? 'Mandato' : 'Vida política', titulo: m ? CARGO[m.cargo][fem] : pol.fase === 'candidato' ? 'Em campanha' : flex(g, 'Filiado', 'Filiada', 'Filiade'),
      sub: [pol.partido, m ? `${anoDe(m.tInicio)}–${anoDe(m.tFim)}` : undefined].filter(Boolean).join(' · '),
      dados: [
        ...(m ? [{ r: 'Aprovação', v: `${Math.round(m.aprovacao)}%` }] : []),
        { r: 'Eleições vencidas', v: String(eleicoes) },
        { r: 'Reputação', v: pol.reputacao >= 70 ? 'alta' : pol.reputacao >= 40 ? 'média' : 'baixa' }
      ],
      lista: pol.historico.length ? { titulo: 'Nas urnas', itens: pol.historico.slice(-4).reverse().map(h => `${anoDe(h.t)} · ${CARGO[h.cargo][fem]}: ${h.resultado === 'eleito' ? flex(g, 'eleito', 'eleita', 'eleite') : h.resultado}`) } : undefined
    };
  }
  const empresas = (v.financas.empresas ?? []).filter(x => x.estado !== 'encerrada' && !x.tFim);
  const em = v.trabalho.atual;
  const oc = em ? ocupacaoOuNula(em.ocupacaoId) : undefined;
  if (empresas.length && (!em || empresas.some(x => x.papel === 'dono'))) {
    return {
      tipo: 'empresario', selo: flex(g, 'Empresário', 'Empresária', 'Empresárie'), titulo: empresas[0].nome, sub: `${PAPEL_EMP[empresas[0].papel] ?? empresas[0].papel} · ${Math.round(empresas[0].parte * 100)}%`,
      dados: [{ r: 'Empresas', v: String(empresas.length) }, { r: 'Desde', v: String(anoDe(Math.min(...empresas.map(x => x.tInicio)))) }],
      lista: empresas.length > 1 ? { titulo: 'Participações', itens: empresas.slice(0, 5).map(x => `${x.nome} · ${PAPEL_EMP[x.papel] ?? x.papel} · ${Math.round(x.parte * 100)}%`) } : undefined
    };
  }
  const cv = v.caminhos.curriculo ?? [];
  if (cv.length >= 2 && (!em || /ator|atriz|músic|cantor|artista|bailarin|dançarin/i.test(oc?.nome?.[0] ?? ''))) {
    const marcantes = cv.filter(x => x.repercussao >= 2);
    return {
      tipo: 'artista', selo: 'Carreira artística', titulo: cv[cv.length - 1].titulo, sub: `${cv[cv.length - 1].papel} · ${anoDe(cv[cv.length - 1].t)}`,
      dados: [{ r: 'Trabalhos', v: String(cv.length) }, { r: 'Repercutiram', v: String(marcantes.length) }],
      lista: { titulo: 'Trabalhos recentes', itens: cv.slice(-4).reverse().map(x => `${anoDe(x.t)} · ${x.titulo} (${x.papel})`) }
    };
  }
  if (!em || !oc) return undefined;
  const nome = oc.nome[fem] ?? oc.nome[0];
  const anos = Math.max(0, Math.floor((v.t - em.tInicio) / 12));
  const esp = especialidadeMedica(v);
  const medico = /médic/i.test(nome);
  return {
    tipo: medico ? 'medico' : 'emprego', selo: medico ? 'Medicina' : em.contrato === 'autonomo' ? 'Por conta própria' : 'Crachá', titulo: nome.charAt(0).toUpperCase() + nome.slice(1),
    sub: [em.clube ?? em.empregador, medico && esp ? ESPEC[esp] : undefined].filter(Boolean).join(' · '),
    dados: [
      { r: 'Desde', v: `${anoDe(em.tInicio)}${anos ? ` (${anos} ${anos === 1 ? 'ano' : 'anos'})` : ''}` },
      { r: 'Salário', v: `${dinheiroCurto(em.salario)}/mês` },
      { r: 'Desempenho', v: em.desempenho >= 75 ? 'excelente' : em.desempenho >= 55 ? 'bom' : em.desempenho >= 35 ? 'regular' : 'em risco' }
    ],
    lista: v.trabalho.historico.length ? { titulo: 'Antes', itens: v.trabalho.historico.slice(-3).reverse().map(h => { const o = ocupacaoOuNula(h.ocupacaoId); return `${anoDe(h.tInicio)}–${anoDe(h.tFim)} · ${o ? (o.nome[fem] ?? o.nome[0]) : 'trabalho'}, ${h.empregador}`; }) } : undefined
  };
}

export function Cracha15({ vida }: { vida: Vida }) {
  if (idade(vida) < 14) return null;
  const c = lerCracha(vida);
  if (!c) return null;
  return (
    <section className={`cracha15 cracha15--${c.tipo}`} aria-label={`${c.selo}: ${c.titulo}`}>
      <div className="cracha15__faixa"><span>{c.selo}</span></div>
      <div className="cracha15__corpo">
        <p className="cracha15__titulo">{c.titulo}</p>
        {c.sub && <p className="cracha15__sub">{c.sub}</p>}
        <dl className="cracha15__dados">{c.dados.map(d => <div key={d.r}><dt>{d.r}</dt><dd>{d.v}</dd></div>)}</dl>
        {c.lista && <div className="cracha15__lista"><p>{c.lista.titulo}</p><ul>{c.lista.itens.map(x => <li key={x}>{x}</li>)}</ul></div>}
      </div>
    </section>
  );
}
