/**
 * REWORK 12.2 — o painel do ramo de cada empresa: o que é próprio dela (o cardápio e a nota do restaurante, as
 * estrelas e a ocupação do hotel, as obras do museu, os animais e os recintos do zoológico...), as decisões do ramo
 * com o custo dito antes, quem decide o dia a dia, os alertas — e a visão geral de quem tem várias empresas.
 *
 * Nada aqui calcula regra: as leituras, os custos e os bloqueios vêm do motor (`sistemas/setores`).
 */

import { useState } from 'react';
import type { Acao } from '../../motor/acoes';
import type { Empresa, Vida } from '../../motor/tipos';
import { disponibilidade } from '../../motor/acoes';
import { podeTentar } from '../../motor/plausibilidade';
import { anoDe } from '../../motor/tempo';
import { alertasDaEmpresa, bemEstarDoAnimal, decideOGestor, decisoesDoSetor, garantirSetor, indicadoresDoSetor, ocupacaoDoRecinto, type DecisaoDoSetor } from '../../motor/sistemas/setores';
import { custoDaObra } from '../../motor/sistemas/setores';
import { especieDeZoo, habitat } from '../../motor/dados/setores';
import { empresasAtivas } from '../../motor/sistemas/empresas';
import { tipoDeEmpresa } from '../../motor/dados/empresas';
import { BotaoAcao } from '../comum';
import { dinheiroCurto } from '../leituraMaterial';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** As escolhas exclusivas (um conceito, uma categoria, um fornecedor): a atual marcada, as outras clicáveis. */
const EXCLUSIVOS = new Set(['conceito', 'culinaria', 'ingredientes', 'fornecedor', 'estrelas', 'publico', 'politica', 'temporada', 'atendimento_clinica', 'segmento', 'estoque', 'fornecedor_loja', 'linha', 'alimentacao']);

function Opcoes({ vida, agir, e, grupo, lista }: { vida: Vida; agir: (a: Acao) => boolean; e: Empresa; grupo: string; lista: DecisaoDoSetor[] }) {
  const [motivo, setMotivo] = useState<string | undefined>();
  return (
    <div className="ramo-opcoes">
      <div className="ramo-opcoes__lista" role="radiogroup" aria-label={grupo}>
        {lista.map(d => {
          const a: Acao = { tipo: 'setor', empresaId: e.id, decisao: d.id, alvo: d.alvo };
          const v = disponibilidade(vida, a);
          const pode = podeTentar(v);
          return (
            <button key={`${d.id}-${d.alvo}`} type="button" role="radio" aria-checked={!!d.atual} className={`ramo-opcao${d.atual ? ' ramo-opcao--atual' : ''}`}
              disabled={!d.atual && !pode} title={d.descricao} onClick={() => { if (d.atual) return; if (!agir(a)) setMotivo(v.motivo); else setMotivo(undefined); }}
              onFocus={() => setMotivo(d.atual ? undefined : !pode ? v.motivo : d.descricao)}>
              <span>{d.rotulo}</span>
              {d.custo > 0 && !d.atual && <small>{dinheiroCurto(d.custo)}</small>}
            </button>
          );
        })}
      </div>
      {motivo && <p className="nota ramo-opcoes__dica">{motivo}</p>}
    </div>
  );
}

/** O painel do ramo dentro do cartão da empresa. */
export function PainelDoRamo({ vida, agir, e }: { vida: Vida; agir: (a: Acao) => boolean; e: Empresa }) {
  garantirSetor(vida, e);
  const ind = indicadoresDoSetor(vida, e);
  const alertas = alertasDaEmpresa(vida, e);
  const manda = e.papel !== 'investidor';
  const gestor = decideOGestor(e);
  const decisoes = manda ? decisoesDoSetor(vida, e).filter(d => d.id !== 'receber') : [];
  const grupos = [...new Set(decisoes.map(d => d.grupo))];
  const s = e.setor!;
  return (
    <div className={`ramo ramo--${e.tipo}`}>
      <dl className="ramo-indicadores">
        {ind.map(x => <div key={x.rotulo} className={x.tom ? `ramo-indicador ramo-indicador--${x.tom}` : 'ramo-indicador'}><dt>{x.rotulo}</dt><dd>{x.valor}</dd></div>)}
      </dl>
      {alertas.length > 0 && <p className="ramo-alertas" role="status">Pede atenção: {alertas.join(' · ')}.</p>}
      {s.restaurante?.avaliacoes?.length ? (
        <div className="ramo-bloco">
          <p className="rotulo-pequeno">O que o público escreveu</p>
          <ul className="ramo-avaliacoes">{s.restaurante.avaliacoes.slice(-3).reverse().map(a => <li key={a.t}><span className="ramo-nota" aria-label={`Nota ${a.nota.toFixed(1)} de 5`}>{a.nota.toFixed(1)}</span> {a.texto} <span className="nota">({anoDe(a.t)})</span></li>)}</ul>
        </div>
      ) : null}
      {s.museu && <ObrasDoMuseu vida={vida} agir={agir} e={e} />}
      {s.zoo && <AcervoDoZoo vida={vida} agir={agir} e={e} />}
      {manda && e.estado !== 'encerrada' && (
        <details className="objeto__fazer ramo-decidir">
          <summary className="objeto__fazer-titulo">Decidir o {tipoDeEmpresa(e.tipo).rotulo.toLowerCase()} por dentro</summary>
          {e.gestao.quem === 'contratada' && (
            <div className="ramo-delegar">
              <p className="nota">{gestor ? `${e.gestao.nome ?? 'O gestor'} decide o dia a dia com o caixa da empresa (o bom acerta; o fraco descuida). As escolhas abaixo continuam abertas a você.` : 'Você decide o dia a dia: o gestor só executa.'}</p>
              <BotaoAcao vida={vida} acao={{ tipo: 'empresa_delegar', empresaId: e.id, delegar: !gestor }} agir={agir} variante="discreto">{gestor ? 'Decidir eu mesm' + (vida.eu.genero === 'feminino' ? 'a' : 'o') : 'Deixar o gestor decidir o dia a dia'}</BotaoAcao>
            </div>
          )}
          <div className="ramo-grupos">
            {grupos.map(g => {
              const lista = decisoes.filter(d => d.grupo === g);
              const exclusivo = lista.every(d => EXCLUSIVOS.has(d.id));
              return (
                <section key={g} className="ramo-grupo" aria-label={g}>
                  <p className="rotulo-pequeno">{g}</p>
                  {exclusivo ? <Opcoes vida={vida} agir={agir} e={e} grupo={g} lista={lista} /> : (
                    <div className="grupo-acoes">
                      {lista.map(d => <BotaoAcao key={`${d.id}-${d.alvo}`} vida={vida} acao={{ tipo: 'setor', empresaId: e.id, decisao: d.id, alvo: d.alvo }} agir={agir} variante="discreto" ocultarImpossivel>{`${d.rotulo}${d.custo > 0 ? ` (${dinheiroCurto(d.custo)})` : ''}`}</BotaoAcao>)}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}

function ObrasDoMuseu({ vida, agir, e }: { vida: Vida; agir: (a: Acao) => boolean; e: Empresa }) {
  const m = e.setor!.museu!;
  const manda = e.papel !== 'investidor';
  return (
    <details className="ramo-bloco ramo-obras">
      <summary className="rotulo-pequeno">As obras de destaque ({m.obras.length})</summary>
      <ul className="ramo-lista">
        {m.obras.map(o => (
          <li key={o.id} className="ramo-item">
            <p><strong>{cap(o.nome)}</strong> <span className="nota">{o.periodo} · {o.origem === 'emprestimo' ? `emprestada por ${o.de} até ${anoDe(o.ate ?? vida.t)}` : o.fora ? `emprestada a ${o.fora.instituicao}` : o.exposta ? 'exposta' : 'na reserva técnica'} · {o.autenticidade === 'verificada' ? 'com laudo' : 'sem laudo'} · conservação {o.conservacao >= 70 ? 'boa' : o.conservacao >= 45 ? 'regular' : 'ruim'} · uns {dinheiroCurto(o.valor)}</span></p>
            {manda && o.origem !== 'emprestimo' && (
              <div className="grupo-acoes grupo-acoes--linha">
                <BotaoAcao vida={vida} acao={{ tipo: 'obra', empresaId: e.id, obraId: o.id, oque: 'verificar' }} agir={agir} variante="discreto" ocultarBloqueado>{`Pedir laudo de autenticidade (${dinheiroCurto(custoDaObra(vida, e, 'verificar', o))})`}</BotaoAcao>
                <BotaoAcao vida={vida} acao={{ tipo: 'obra', empresaId: e.id, obraId: o.id, oque: 'restaurar_obra' }} agir={agir} variante="discreto" ocultarBloqueado>{`Restaurar (${dinheiroCurto(custoDaObra(vida, e, 'restaurar_obra', o))})`}</BotaoAcao>
                <BotaoAcao vida={vida} acao={{ tipo: 'obra', empresaId: e.id, obraId: o.id, oque: 'emprestar_obra' }} agir={agir} variante="discreto" ocultarBloqueado>Emprestar a outro museu por um ano</BotaoAcao>
                <BotaoAcao vida={vida} acao={{ tipo: 'obra', empresaId: e.id, obraId: o.id, oque: 'expor' }} agir={agir} variante="discreto" ocultarBloqueado>{o.exposta ? 'Recolher à reserva' : 'Expor'}</BotaoAcao>
              </div>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}

function AcervoDoZoo({ vida, agir, e }: { vida: Vida; agir: (a: Acao) => boolean; e: Empresa }) {
  const z = e.setor!.zoo!;
  const manda = e.papel !== 'investidor';
  const receber = manda ? decisoesDoSetor(vida, e).filter(d => d.id === 'receber') : [];
  return (
    <>
      <details className="ramo-bloco ramo-recintos">
        <summary className="rotulo-pequeno">Recintos e animais ({z.animais.length})</summary>
        <ul className="ramo-lista">
          {z.recintos.map(q => {
            const ocup = ocupacaoDoRecinto(e, q.id);
            const animais = z.animais.filter(a => a.recinto === q.id);
            return (
              <li key={q.id} className={`ramo-item${ocup > q.vagas ? ' ramo-item--ruim' : ''}`}>
                <p><strong>{habitat(q.habitat).nome}</strong> <span className="nota">{ocup}/{q.vagas} vagas{ocup > q.vagas ? ' (lotado)' : ''} · recinto {q.qualidade >= 70 ? 'bom' : q.qualidade >= 50 ? 'regular' : 'precário'}</span></p>
                {animais.length > 0 && (
                  <p className="ramo-animais">{animais.map(a => {
                    const x = especieDeZoo(a.especie);
                    const anos = Math.max(0, Math.floor((vida.t - a.nasceu) / 12));
                    const bem = bemEstarDoAnimal(e, a);
                    return <span key={a.id} className={`ramo-animal${bem < 50 ? ' ramo-animal--ruim' : ''}`} title={(a.historia ?? []).join(' ')}>{a.nome} <small>({x?.nome ?? a.especie}, {anos} {anos === 1 ? 'ano' : 'anos'}{a.origem === 'resgate' ? ', resgatado' : a.origem === 'doacao' ? ', era de alguém' : ''})</small></span>;
                  })}</p>
                )}
              </li>
            );
          })}
        </ul>
        {(z.memoria ?? []).length > 0 && <p className="nota">Na memória do zoológico: {(z.memoria ?? []).slice(-3).map(x => x.texto).join(' ')}</p>}
      </details>
      {receber.length > 0 && (
        <details className="ramo-bloco">
          <summary className="rotulo-pequeno">Receber animais (transferências entre instituições e programas de conservação)</summary>
          <p className="nota">Animal não se compra como mercadoria: chega por transferência de outra instituição, por programa de conservação (as espécies ameaçadas) ou por resgate. Só vem se houver recinto adequado, com vaga, e a equipe que a espécie pede.</p>
          <div className="grupo-acoes">
            {receber.map(d => <BotaoAcao key={d.alvo} vida={vida} acao={{ tipo: 'setor', empresaId: e.id, decisao: 'receber', alvo: d.alvo }} agir={agir} variante="discreto">{`${d.rotulo} (${dinheiroCurto(d.custo)}) — ${d.descricao}`}</BotaoAcao>)}
          </div>
        </details>
      )}
    </>
  );
}

/** A visão geral de quem tem várias empresas: uma linha por empresa, o que pede atenção — sem abrir dez telas. */
export function VisaoGeralDasEmpresas({ vida }: { vida: Vida }) {
  const lista = empresasAtivas(vida);
  if (lista.length < 2) return null;
  return (
    <div className="pat-rolagem ramo-visao" data-rola-x>
      <table className="pat-tabela">
        <caption>Visão geral: {lista.length} empresas</caption>
        <thead><tr><th scope="col">Empresa</th><th scope="col">Resultado do ano</th><th scope="col">Quem decide</th><th scope="col">Pede atenção</th></tr></thead>
        <tbody>
          {lista.map(e => {
            const al = alertasDaEmpresa(vida, e);
            return (
              <tr key={e.id}>
                <th scope="row">{e.nome}<br /><small className="nota">{tipoDeEmpresa(e.tipo).rotulo}</small></th>
                <td className={(e.ultimo?.resultado ?? 0) < 0 ? 'perda' : 'ganho'}>{e.ultimo ? `${e.ultimo.resultado < 0 ? '− ' : ''}${dinheiroCurto(Math.abs(e.ultimo.resultado))}` : '—'}</td>
                <td>{e.papel === 'investidor' ? 'os sócios' : e.gestao.quem === 'propria' ? 'você' : decideOGestor(e) ? 'o gestor' : 'você (o gestor executa)'}</td>
                <td>{al.length ? al.join(' · ') : 'nada'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
