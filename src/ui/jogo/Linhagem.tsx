/**
 * As vidas anteriores da família (sucessão). Cada geração jogada antes desta,
 * com o que marcou, o que construiu, o que deixou — e a Linha da Vida DELA,
 * consultável. Nada disso é da Linha da Vida de quem é jogado agora: é
 * memória da família (`vida.linhagem`).
 */

import { formatarDinheiro } from '../../motor/mundo/moeda';
import type { Vida } from '../../motor/tipos';
import { anoDe } from '../../motor/tempo';
import { idadeEm } from '../../motor/tempo';
import { nomeLugar, paisDaCidade } from '../../motor/dados/lugares';
import { flex } from '../../motor/texto';
import { Retrato } from '../avatar/Retrato';

export function Linhagem({ vida }: { vida: Vida }) {
  const gs = vida.linhagem?.geracoes ?? [];
  if (!gs.length) return null;
  return (
    <section className="trajetorias-vida" aria-labelledby="linhagem-titulo">
      <h2 id="linhagem-titulo" className="voce-subtitulo">Quem veio antes</h2>
      <div className="linhagem">
        {[...gs].reverse().map(g => {
          const i = idadeEm(g.tNasc, g.tMorte);
          const lacoComVoce = vida.vinculos[g.pessoaId]?.parentesco;
          const h = g.heranca;
          return (
            <details key={g.pessoaId} className="linhagem__geracao">
              <summary>
                <Retrato visual={g.visual} genero={g.genero} idade={i} semente={g.pessoaId} tamanho={48} especie={undefined} rotulo={g.nome} falecido />
                <span>
                  <span className="linhagem__nome">{g.nome} {g.sobrenome}</span>
                  <span className="linhagem__datas">{anoDe(g.tNasc)}–{anoDe(g.tMorte)} · {lacoComVoce === 'pai' || lacoComVoce === 'mae' ? flex(g.genero, 'seu pai', 'sua mãe', 'sue mãe') : lacoComVoce === 'avo' ? flex(g.genero, 'seu avô', 'sua avó', 'sue avó') : 'da família'}{g.sucessor ? ` · continuou com ${g.sucessor.nome}` : ''}</span>
                </span>
              </summary>
              <div className="linhagem__corpo">
                <p>Nasceu em {nomeLugar(g.municipioNatal)} e morreu aos {i}, em {nomeLugar(g.municipioMorte)} ({g.causa}).</p>
                {g.resumo.length > 0 && <ul>{g.resumo.slice(0, 6).map((t, k) => <li key={k}>{t}</li>)}</ul>}
                {g.trajetorias.length > 0 && <ul>{g.trajetorias.slice(0, 5).map((t, k) => <li key={k}>{t.titulo} · {t.periodo}{t.resumo ? ` — ${t.resumo}` : ''}</li>)}</ul>}
                {/* Na moeda do país onde a pessoa morreu (a herança foi feita lá). */}
                <p>{(h.bruto ?? h.liquido) > 0 ? `Deixou ${formatarDinheiro(h.liquido, paisDaCidade(g.municipioMorte))}${h.partes.length ? `, partilhados entre ${h.partes.length === 1 ? 'uma pessoa' : `${h.partes.length} pessoas`}` : ''}${h.doacao ? `; ${formatarDinheiro(h.doacao.valor, paisDaCidade(g.municipioMorte))} doados para ${h.doacao.destino}` : ''}.` : 'Não deixou bens.'}</p>
                <details>
                  <summary>A Linha da Vida de {g.nome}</summary>
                  <ul>{g.biografia.map((e, k) => <li key={k} style={e.marco ? { color: 'var(--text-primary)' } : undefined}>{e.idade} · {e.texto}</li>)}</ul>
                </details>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
