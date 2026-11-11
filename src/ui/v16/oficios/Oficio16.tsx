/**
 * VIDA 16 · A PASTA DO OFÍCIO — em Caminhos · Trabalho · Agora, abaixo do crachá, para direito, docência e tecnologia:
 * o que chegou este ano (os casos, as turmas, o projeto), as decisões de cada coisa e o que ficou (reputação, placar,
 * feitos). Só lê e chama as ações de `motor/v16/oficios`.
 */
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../apresentar';
import { anoDe } from '../../../motor/tempo';
import { decisoesDe16, pastaDe16, type Item16, type Oficio16 } from '../../../motor/v16/oficios/oficios16';
import { PLANOS_B } from '../../../motor/v16/oficios/oficios16b';
import { ABORDAGENS16, AREA_JURIDICA16, PERFIS_DE_TURMA16, RITMOS16, type Abordagem16, type Ritmo16 } from '../../../motor/dados16/oficios/catalogo16';
import '../jogo16.css';

const TITULO: Record<Oficio16['ramo'], string> = { direito: 'A pasta do escritório', docencia: 'As turmas do ano', tecnologia: 'O projeto do ano',
  engenharia: 'A obra do ano', enfermagem: 'Os plantões do ano', contabilidade: 'A carteira do ano', jornalismo: 'As pautas do ano', psicologia: 'O consultório' };
const TIPO_B: Record<string, string> = { obra: 'Obra', imprevisto: 'Imprevisto', patologia: 'Responsabilidade técnica', plantao: 'No plantão', fechamento: 'Prazos fiscais', pauta: 'Pauta', paciente: 'Paciente' };
const ESTADO: Record<Item16['estado'], string> = { aberto: 'Decidir', aceito: 'Escolher a estratégia', andamento: 'Em andamento', resolvido: 'Resolvido', recusado: 'Recusado' };

function forcaDasProvas(n = 50) { return n >= 70 ? 'provas fortes' : n >= 45 ? 'provas razoáveis' : 'provas frágeis'; }
function adversario(n = 0) { return n === 2 ? 'do outro lado, um adversário de peso' : n === 1 ? 'do outro lado, uma empresa' : 'do outro lado, uma pessoa'; }

function Item({ vida, it, agir }: { vida: Vida; it: Item16; agir: (a: Acao) => boolean }) {
  const a = (oque: Extract<Acao, { tipo: 'oficio16' }>['oque']): Acao => ({ tipo: 'oficio16', oque });
  return (
    <li className={`of16-item of16-item--${it.estado}${it.bom === false ? ' of16-item--mal' : it.bom ? ' of16-item--bem' : ''}`}>
      <div className="of16-item__topo">
        <span className="of16-item__tipo">{it.tipo === 'caso' ? AREA_JURIDICA16[it.area!] ?? 'Processo' : it.tipo === 'turma' ? `Turma ${PERFIS_DE_TURMA16[it.perfil!].nome}` : it.tipo === 'aluno' ? 'Um aluno' : it.tipo === 'dilema' ? 'Dilema' : it.tipo === 'incidente' ? 'Urgente' : it.tipo === 'falha' ? 'Segurança' : it.tipo === 'lideranca' ? 'Responsabilidade' : TIPO_B[it.tipo] ?? 'Projeto'}</span>
        <span className="of16-item__estado">{ESTADO[it.estado]}</span>
      </div>
      <h4 className="of16-item__titulo">{it.titulo}</h4>
      <p className="of16-item__texto">{it.texto}</p>
      {it.tipo === 'obra' && <p className="of16-item__meta">orçamento de {dinheiroCurto(it.valor ?? 0)} · complexidade {(it.forca ?? 0) >= 70 ? 'alta' : (it.forca ?? 0) >= 55 ? 'média' : 'baixa'}{it.latente ? ' · com improviso' : ''}</p>}
      {it.tipo === 'pauta' && <p className="of16-item__meta">potencial de repercussão {(it.forca ?? 0) >= 70 ? 'alto' : (it.forca ?? 0) >= 50 ? 'médio' : 'baixo'}{it.preparo ? ' · apurada a fundo' : ''}</p>}
      {it.tipo === 'paciente' && <p className="of16-item__meta">evolução: {(it.forca ?? 0) >= 65 ? 'perto da alta' : (it.forca ?? 0) >= 40 ? 'avançando' : 'no começo'}</p>}
      {it.tipo === 'caso' && <p className="of16-item__meta">{forcaDasProvas(it.forca)} · {adversario(it.adversario)} · em jogo, {dinheiroCurto(it.valor ?? 0)}{it.preparo ? ' · preparado a fundo' : ''}</p>}
      {it.resultado && <p className="of16-item__resultado">{it.resultado}</p>}
      <div className="of16-item__acoes">
        {it.estado === 'aberto' && (it.tipo === 'caso' || it.tipo === 'projeto_escola' || it.tipo === 'lideranca') && <>
          <BotaoAcao vida={vida} acao={a({ op: 'aceitar', id: it.id })} agir={agir} variante="principal">{it.tipo === 'caso' ? 'Pegar o caso' : 'Topar'}</BotaoAcao>
          <BotaoAcao vida={vida} acao={a({ op: 'recusar', id: it.id })} agir={agir} variante="discreto">{it.tipo === 'caso' ? 'Recusar' : 'Deixar para outro'}</BotaoAcao>
        </>}
        {it.estado === 'aceito' && <>
          <BotaoAcao vida={vida} acao={a({ op: 'estrategia', id: it.id, escolha: 'acordo' })} agir={agir} variante="secundario">Buscar um acordo</BotaoAcao>
          <BotaoAcao vida={vida} acao={a({ op: 'estrategia', id: it.id, escolha: 'julgamento' })} agir={agir} variante="principal">Ir a julgamento</BotaoAcao>
        </>}
        {it.tipo === 'caso' && it.estado === 'andamento' && !it.preparo && <BotaoAcao vida={vida} acao={a({ op: 'preparar', id: it.id })} agir={agir} variante="secundario">Preparar a fundo</BotaoAcao>}
        {it.tipo === 'caso' && it.estado === 'resolvido' && it.bom === false && it.escolha === 'julgamento' && !it.recurso && <BotaoAcao vida={vida} acao={a({ op: 'recorrer', id: it.id })} agir={agir} variante="secundario" ocultarBloqueado>Recorrer</BotaoAcao>}
        {decisoesDe16(it).map(d => <BotaoAcao key={d.escolha} vida={vida} acao={a({ op: 'decidir', id: it.id, escolha: d.escolha })} agir={agir} variante="secundario">{d.rotulo}</BotaoAcao>)}
      </div>
    </li>
  );
}

export default function Oficio16({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const p = pastaDe16(vida);
  if (!p) return null;
  const aberta = vida.oficio16?.ano === anoDe(vida.t) && vida.oficio16.ramo === p.ramo;
  const rep = p.rep >= 75 ? 'nome respeitado' : p.rep >= 55 ? 'boa reputação' : p.rep >= 35 ? 'reputação em construção' : 'reputação abalada';
  return (
    <section className="of16" aria-labelledby="of16-titulo">
      <header className="of16__cabeca">
        <h3 id="of16-titulo" className="of16__titulo">{TITULO[p.ramo]} <span className="of16__ano">{p.ano}</span></h3>
        <p className="of16__lede">
          <span className="of16__selo">{rep}</span>
          {p.placar && <span>{p.placar.ganhas} vitórias · {p.placar.acordos} acordos · {p.placar.perdidas} derrotas</span>}
          {p.ramo === 'docencia' && <span>{p.turmas ?? 0} turmas na carreira</span>}
          {p.ramo === 'engenharia' && <span>{p.obras?.length ?? 0} obras entregues{(p.obras ?? []).some(o => o.risco >= 45 && !o.patologia) ? ' · alguma com risco guardado' : ''}</span>}
          {p.ramo === 'enfermagem' && <span>{(p.plantoes ?? 0).toLocaleString('pt-BR')} plantões · cansaço {(p.sobrecarga ?? 0) >= 70 ? 'no limite' : (p.sobrecarga ?? 0) >= 45 ? 'acumulado' : 'sob controle'}</span>}
          {p.ramo === 'contabilidade' && p.carteira && <span>{p.carteira.clientes} clientes · {p.carteira.multas} multas por prazo</span>}
          {p.ramo === 'jornalismo' && <span>credibilidade {(p.credibilidade ?? 50) >= 70 ? 'alta' : (p.credibilidade ?? 50) >= 45 ? 'boa' : 'abalada'} · {p.fontes ?? 0} fontes de confiança</span>}
          {p.ramo === 'psicologia' && <span>{(p.pacientes ?? []).filter(x => x.estado === 'ativo').length} em acompanhamento · {p.altas ?? 0} altas</span>}
          {p.ramo === 'tecnologia' && <span>dívida técnica: {(p.divida ?? 0) >= 60 ? 'alta' : (p.divida ?? 0) >= 35 ? 'média' : 'baixa'} · {p.entregas?.ok ?? 0} entregas</span>}
        </p>
      </header>
      {p.ramo === 'docencia' && (
        <div className="of16__escolha" role="group" aria-label="A abordagem do ano">
          <p className="of16__pergunta">{p.abordagem && aberta ? `Este ano: ${ABORDAGENS16[p.abordagem].nome.toLowerCase()}.` : 'Como conduzir as turmas este ano?'}</p>
          {!(p.abordagem && aberta) && (Object.keys(ABORDAGENS16) as Abordagem16[]).map(k => <BotaoAcao key={k} vida={vida} acao={{ tipo: 'oficio16', oque: { op: 'abordagem', escolha: k } }} agir={agir} variante="secundario"><span className="of16__opcao"><strong>{ABORDAGENS16[k].nome}</strong><span>{ABORDAGENS16[k].texto}</span></span></BotaoAcao>)}
        </div>
      )}
      {p.ramo === 'tecnologia' && (
        <div className="of16__escolha" role="group" aria-label="O ritmo do projeto">
          <p className="of16__pergunta">{p.ritmo && aberta ? `Combinado: ${RITMOS16[p.ritmo].nome.toLowerCase()}.` : 'Qual o ritmo do projeto?'}</p>
          {!(p.ritmo && aberta) && (Object.keys(RITMOS16) as Ritmo16[]).map(k => <BotaoAcao key={k} vida={vida} acao={{ tipo: 'oficio16', oque: { op: 'ritmo', escolha: k } }} agir={agir} variante="secundario"><span className="of16__opcao"><strong>{RITMOS16[k].nome}</strong><span>{RITMOS16[k].texto}</span></span></BotaoAcao>)}
        </div>
      )}
      {PLANOS_B[p.ramo] && (
        <div className="of16__escolha" role="group" aria-label={PLANOS_B[p.ramo].pergunta}>
          <p className="of16__pergunta">{p.plano && aberta ? `${PLANOS_B[p.ramo].feita}: ${PLANOS_B[p.ramo].opcoes.find(o => o.id === p.plano)?.nome.toLowerCase()}.` : PLANOS_B[p.ramo].pergunta}</p>
          {!(p.plano && aberta) && PLANOS_B[p.ramo].opcoes.map(o => <BotaoAcao key={o.id} vida={vida} acao={{ tipo: 'oficio16', oque: { op: 'plano', escolha: o.id } }} agir={agir} variante="secundario"><span className="of16__opcao"><strong>{o.nome}</strong><span>{o.texto}</span></span></BotaoAcao>)}
        </div>
      )}
      <ul className="of16__itens">{p.itens.map(it => <Item key={it.id} vida={vida} it={it} agir={agir} />)}</ul>
      {p.feitos.length > 0 && (
        <details className="of16__feitos">
          <summary>O que ficou da carreira ({p.feitos.length})</summary>
          <ul>{[...p.feitos].reverse().slice(0, 12).map((f, k) => <li key={k} className={f.bom ? 'of16__feito--bom' : 'of16__feito--mal'}><span>{anoDe(f.t)}</span> {f.texto}</li>)}</ul>
        </details>
      )}
    </section>
  );
}
