/**
 * VIDA 16 · A VIDA RELIGIOSA — em Caminhos · Outros: os caminhos que a sua tradição conhece (com o que cada um pede) e,
 * para quem segue um, a etapa, o que falta, os gestos do ano, a comunidade, o projeto, a questão do ano e a trajetória.
 */
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../apresentar';
import { anoDe } from '../../../motor/tempo';
import { idade } from '../../../motor/nucleo';
import { TRADICOES16 } from '../../../motor/dados16/religiao/tradicoes16';
import { ativa16, caminhosPossiveis16, comoSeChega16, custos16, etapaAtual16, nomeDaEtapa16, oQueFalta16, proximaEtapa16, type GestoRel16 } from '../../../motor/v16/religiao/religiao16';
import '../jogo16.css';

const nivel = (n: number) => (n >= 80 ? 'muito alto' : n >= 60 ? 'alto' : n >= 40 ? 'médio' : n >= 20 ? 'baixo' : 'muito baixo');
const pessoas = (n: number) => (n >= 1e6 ? `${(n / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} milhões` : n >= 1000 ? `${Math.round(n / 1000).toLocaleString('pt-BR')} mil` : String(n));

export default function VidaReligiosa16({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const i = idade(vida);
  const r = vida.religiao16;
  if (!ativa16(vida)) {
    if (i < 14) return null;
    const ops = caminhosPossiveis16(vida);
    if (!ops.length) return null;
    return (
      <section className="divisao__secao rel16" aria-labelledby="rel16-titulo">
        <h2 id="rel16-titulo" className="secao-fio">Vida religiosa</h2>
        <p className="nota">A sua tradição conhece estes caminhos. Cada um tem a sua formação, as suas regras e o seu jeito de reconhecer quem serve.</p>
        <ul className="rel16__caminhos">
          {ops.map(({ t }) => {
            const T = TRADICOES16[t];
            return (
              <li key={t} className="rel16__caminho">
                <h3>{T.nome}</h3>
                <p className="rel16__etapas">{T.etapas.map(e => nomeDaEtapa16(vida, e)).join(' → ')}</p>
                {T.nota && <p className="nota">{T.nota}</p>}
                <BotaoAcao vida={vida} acao={{ tipo: 'religiao16', oque: { op: 'entrar', tradicao: t } }} agir={agir} variante="secundario">Seguir este caminho</BotaoAcao>
              </li>
            );
          })}
        </ul>
        {r?.saiu && <p className="nota">Você deixou o caminho em {anoDe(r.saiu.t)}.</p>}
      </section>
    );
  }
  const T = TRADICOES16[r!.tradicao];
  const e = etapaAtual16(r!);
  const n = proximaEtapa16(r!);
  const falta = oQueFalta16(vida, r!);
  const feitos = r!.ano === anoDe(vida.t) ? r!.gestos : [];
  const custo = n ? custos16.obrigacao(r!.tradicao, n) : 0;
  return (
    <section className="divisao__secao rel16 rel16--ativa" aria-labelledby="rel16-titulo">
      <h2 id="rel16-titulo" className="secao-fio">Vida religiosa · {T.nome}</h2>
      <div className="rel16__cracha">
        <p className="rel16__selo">{nomeDaEtapa16(vida, e)}</p>
        <p className="rel16__desc">{e.texto}</p>
        <dl className="rel16__dados">
          <div><dt>Formação</dt><dd>{nivel(r!.formacao)}</dd></div>
          <div><dt>Reconhecimento</dt><dd>{nivel(r!.prestigio)}</dd></div>
          {e.lidera && <div><dt>Comunidade</dt><dd>{pessoas(r!.comunidade)} {T.fieis}</dd></div>}
          {e.lidera && <div><dt>União</dt><dd>{nivel(r!.coesao)}</dd></div>}
          {e.lidera && <div><dt>Influência</dt><dd>{nivel(r!.influencia)}</dd></div>}
          {e.lidera && <div><dt>Caixa da comunidade</dt><dd>{dinheiroCurto(r!.caixa)}</dd></div>}
          {e.sustento > 0 && <div><dt>Sustento</dt><dd>{dinheiroCurto(e.sustento)} por ano</dd></div>}
        </dl>
      </div>
      {n && (
        <div className="rel16__proxima">
          <p><strong>Próximo passo: {nomeDaEtapa16(vida, n).toLowerCase()}.</strong> {comoSeChega16(n)}{falta.length ? ` Falta: ${falta.join(', ')}.` : ''}</p>
          {(n.como === 'tempo' || n.como === 'obrigacao') && <BotaoAcao vida={vida} acao={{ tipo: 'religiao16', oque: { op: 'avancar' } }} agir={agir} variante="principal">{n.como === 'obrigacao' ? `Fazer a obrigação${custo ? ` (${dinheiroCurto(custo)})` : ''}` : `Dar o passo: ${nomeDaEtapa16(vida, n).toLowerCase()}`}</BotaoAcao>}
          {n.como === 'casa' && <BotaoAcao vida={vida} acao={{ tipo: 'religiao16', oque: { op: 'abrir_casa' } }} agir={agir} variante="principal">Abrir a própria casa ({dinheiroCurto(custos16.casa(r!.tradicao))})</BotaoAcao>}
        </div>
      )}
      <div className="rel16__gestos" role="group" aria-label="O ano na vida religiosa">
        {(['formar', 'servir', 'acolher'] as GestoRel16[]).map(g => (
          <BotaoAcao key={g} vida={vida} acao={{ tipo: 'religiao16', oque: { op: 'gesto', g } }} agir={agir} variante={feitos.includes(g) ? 'discreto' : 'secundario'}>{T.verbos[g]}</BotaoAcao>
        ))}
      </div>
      {r!.questao && (
        <div className="rel16__questao" role="group" aria-label={r!.questao.titulo}>
          <h3>{r!.questao.titulo}</h3>
          <p>{r!.questao.texto}</p>
          <div className="rel16__opcoes">{r!.questao.opcoes.map(o => <BotaoAcao key={o.id} vida={vida} acao={{ tipo: 'religiao16', oque: { op: 'questao', escolha: o.id } }} agir={agir} variante="secundario">{o.rotulo}</BotaoAcao>)}</div>
        </div>
      )}
      {e.lidera && (
        <div className="rel16__projetos">
          <h3>{r!.projeto ? `Em andamento: ${T.projetos.find(p => p.id === r!.projeto!.id)?.nome}` : 'Um projeto para a comunidade'}</h3>
          {!r!.projeto && <ul>{T.projetos.map(p => <li key={p.id}><BotaoAcao vida={vida} acao={{ tipo: 'religiao16', oque: { op: 'projeto', id: p.id } }} agir={agir} variante="discreto"><span className="of16__opcao"><strong>{p.nome} · {dinheiroCurto(p.custo)}</strong><span>{p.texto}</span></span></BotaoAcao></li>)}</ul>}
        </div>
      )}
      {r!.historico.length > 0 && (
        <details className="of16__feitos">
          <summary>A trajetória ({r!.historico.length})</summary>
          <ul>{[...r!.historico].reverse().map((h, k) => <li key={k}><span>{anoDe(h.t)}</span> {h.texto}</li>)}</ul>
        </details>
      )}
      <BotaoAcao vida={vida} acao={{ tipo: 'religiao16', oque: { op: 'sair' } }} agir={agir} variante="discreto">Deixar o caminho</BotaoAcao>
    </section>
  );
}
