/**
 * VIDA 14 · na Justiça (fora do crime): as causas que dá para levar ao juiz, os processos abertos (o advogado, o acordo,
 * a sentença, o recurso) e o que já terminou. Lido de `leituraJustica14` — a tela não faz conta.
 */
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../leituraMaterial';
import { leituraJustica14 } from '../../../motor/v14/justica/justica14';
import '../politica/politica14.css';

const ADV: Record<string, string> = { nenhum: 'Sem advogado (juizado)', defensoria: 'Defensoria Pública', proprio: 'Você mesmo (é advogado)', particular: 'Um advogado particular', escritorio: 'Um escritório de nome' };
const J = (oque: unknown) => ({ tipo: 'justica14', oque } as unknown as Acao);

export function Justica14({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const l = leituraJustica14(vida);
  if (!l.casos.length && !l.fechados.length) return null;
  return (
    <section className="p14" aria-label="Na Justiça">
      {l.casos.length > 0 && (
        <div className="p14__bloco">
          <p className="p14__kicker">Na Justiça</p>
          <ul className="p14__medidas">
            {l.casos.map(c => (
              <li key={c.id} className="p14__medida">
                <p className="p14__medida-nome"><span>{c.titulo} {c.polo === 'autor' ? `contra ${c.contra}` : `· ${c.contra}`}</span>
                  <small>{c.empresa ? `${c.empresa} · ` : ''}em jogo: {dinheiroCurto(c.valor)}{c.pendente ? ' · ainda não foi à Justiça' : c.perdeu ? ' · sentença contra você' : c.decisao ? ` · decisão por volta de ${c.decisao}` : ''}{c.recurso ? ' · em recurso' : ''}{c.advogado ? ` · ${ADV[c.advogado]}` : ''}</small></p>
                {c.acordo !== undefined && <p className="p14__medida-efeito">Acordo na mesa: {dinheiroCurto(c.acordo)}.</p>}
                <div className="grupo-acoes">
                  {(c.pendente || (!c.advogado && !c.perdeu)) && c.opcoesAdvogado.map(o => (
                    <BotaoAcao key={o.a} vida={vida} acao={J({ op: c.pendente ? 'processar' : 'advogado', id: c.id, advogado: o.a })} agir={agir} variante="discreto">
                      {`${c.pendente ? 'Processar · ' : ''}${ADV[o.a]}${o.custo ? ` · ${dinheiroCurto(o.custo)}` : ''}`}
                    </BotaoAcao>
                  ))}
                  {c.acordo !== undefined && <BotaoAcao vida={vida} acao={J({ op: 'aceitar', id: c.id })} agir={agir} variante="secundario">Aceitar o acordo</BotaoAcao>}
                  <BotaoAcao vida={vida} acao={J({ op: 'acordo', id: c.id })} agir={agir} variante="discreto" ocultarImpossivel>Propor acordo</BotaoAcao>
                  <BotaoAcao vida={vida} acao={J({ op: 'recorrer', id: c.id })} agir={agir} variante="secundario" ocultarImpossivel>Recorrer</BotaoAcao>
                  <BotaoAcao vida={vida} acao={J({ op: 'desistir', id: c.id })} agir={agir} variante="discreto" ocultarImpossivel>{c.perdeu ? 'Aceitar a decisão' : c.pendente ? 'Deixar para lá' : c.polo === 'reu' ? 'Pagar' : 'Desistir'}</BotaoAcao>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {l.fechados.length > 0 && (
        <div className="p14__bloco">
          <p className="p14__kicker">Processos encerrados</p>
          <ul className="historico-politico">{l.fechados.map((x, k) => <li key={k}>{x.texto}</li>)}</ul>
        </div>
      )}
    </section>
  );
}

export default Justica14;
