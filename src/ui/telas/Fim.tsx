/** O fim: um obituário e a vida inteira para ler. */

import type { Vida } from '../../motor/tipos';
import type { ControleVida } from '../useVida';
import { filhos, idade, vinculosVivos } from '../../motor/nucleo';
import { anoDe } from '../../motor/tempo';
import { nomeLugar } from '../../motor/dados/lugares';
import { patrimonio } from '../../motor/sistemas/dinheiro';
import { ROTULO_ESCOLARIDADE } from '../../motor/sistemas/escola';
import { nomeOcupacaoId } from '../../motor/sistemas/trabalho';
import { tracosMarcantes } from '../../motor/personalidade';
import { flex } from '../../motor/texto';
import { Retrato } from '../avatar/Retrato';
import { anosDaBiografia, dinheiroCurto, rotuloDe } from '../apresentar';
import { importancia } from '../../motor/sistemas/vinculos';
import { situacaoAfetiva } from '../leitura';

export function Fim({ vida, c }: { vida: Vida; c: ControleVida }) {
  const i = idade(vida);
  const g = vida.eu.tratamento ?? vida.eu.genero;
  const nFilhos = Object.values(vida.vinculos).filter(v => v.parentesco === 'filho').length;
  const empregos = [...vida.trabalho.historico.map(h => h.ocupacaoId), ...(vida.trabalho.atual ? [vida.trabalho.atual.ocupacaoId] : [])];
  const principal = empregos.length ? nomeOcupacaoId(vida, empregos.sort((a, b) => empregos.filter(x => x === b).length - empregos.filter(x => x === a).length)[0]) : null;
  const cidades = new Set(vida.biografia.filter(e => e.tema === 'lugar' && /Mudou-se/.test(e.texto)).map(e => e.texto));
  // Quem mais pesava na vida (papel, afeto, casa, anos, história), não só quem era parente.
  const perto = vinculosVivos(vida).filter(x => !x.p.especie && x.p.nome && importancia(vida, x.p, x.vin) >= 20).sort((a, b) => importancia(vida, b.p, b.vin) - importancia(vida, a.p, a.vin)).slice(0, 8);
  const netos = Object.values(vida.vinculos).filter(v => v.parentesco === 'neto').length;
  const bisnetos = Object.values(vida.vinculos).filter(v => v.parentesco === 'bisneto').length;
  const tracos = tracosMarcantes(vida);
  const anos = anosDaBiografia(vida, false);
  return (
    <div className="fim">
      <header className="fim__cabeca">
        <Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={i} semente="eu" tamanho={140} rotulo={vida.eu.nome} />
        <h1 className="fim__nome">{vida.eu.nome} {vida.eu.sobrenome}</h1>
        <p className="fim__datas">{anoDe(vida.eu.tNasc)} — {anoDe(vida.t)}</p>
        <p className="fim__causa">{flex(g, 'Nascido', 'Nascida', 'Nascide')} em {nomeLugar(vida.eu.municipioNatal)}. Morreu aos {i} anos, {vida.morte?.causa}, em {nomeLugar(vida.moradia.municipioId)}.</p>
      </header>
      <section className="fim__resumo">
        <ul>
          <li>{vida.educacao.concluidos.length ? `Estudou ${vida.educacao.concluidos.map(c => c.nome).join(', ')}.` : `Escolaridade: ${ROTULO_ESCOLARIDADE[vida.educacao.escolaridade]}.`}</li>
          <li>{principal ? `Trabalhou sobretudo como ${principal}.` : empregos.length === 0 ? 'Nunca teve emprego fixo.' : ''}</li>
          <li>{nFilhos === 0 ? 'Não teve filhos.' : nFilhos === 1 ? `Teve um filho: ${filhos(vida)[0]?.nome ?? ''}.` : `Teve ${nFilhos} filhos.`}{netos ? ` ${netos === 1 ? 'Um neto' : `${netos} netos`}${bisnetos ? ` e ${bisnetos === 1 ? 'um bisneto' : `${bisnetos} bisnetos`}` : ''}.` : ''}</li>
          {situacaoAfetiva(vida) && <li>Ao fim, {situacaoAfetiva(vida)}.</li>}
          {cidades.size > 0 && <li>Mudou de cidade {cidades.size === 1 ? 'uma vez' : `${cidades.size} vezes`}.</li>}
          <li>{textoDaHeranca(vida)}</li>
          {tracos.length > 0 && <li>Quem conviveu {flex(g, 'lembra dele', 'lembra dela', 'lembra delu')} como {tracos.join(', ').replace(/, ([^,]*)$/, ' e $1')}.</li>}
        </ul>
        {perto.length > 0 && (
          <>
            <h2>Quem ficou</h2>
            <ul className="fim__pessoas">
              {perto.map(({ p, vin }) => <li key={p.id}>{p.nome} — {rotuloDe(vida, p, vin).replace(/^(seu|sua|sue) /, '')}</li>)}
            </ul>
          </>
        )}
      </section>
      <section className="fim__biografia">
        <h2>Uma vida</h2>
        {anos.map(a => (
          <div key={a.idade} className="fim__ano">
            <span className="fim__ano-idade">{a.idade === 0 ? anoDe(vida.eu.tNasc) : `${a.idade}`}</span>
            <div>{a.entradas.map(e => <p key={e.id} className={`fim__entrada fim__entrada--${e.relevancia}`}>{e.texto}</p>)}</div>
          </div>
        ))}
      </section>
      <div className="fim__acoes">
        <button type="button" className="botao botao--principal" onClick={() => { c.recomecar(); c.setTela('criacao'); }}>Viver outra vida</button>
        <button type="button" className="botao botao--secundario" onClick={() => { c.recomecar(); }}>Voltar ao início</button>
      </div>
    </div>
  );
}

/** O que ficou, em palavras (ATT 4 aprofunda a apresentação). */
function textoDaHeranca(vida: Vida): string {
  const h = vida.morte?.heranca;
  const liq = h?.liquido ?? patrimonio(vida);
  if (!h || liq <= 1000) return patrimonio(vida) < -1000 ? 'As dívidas foram pagas com o que havia; não sobrou herança.' : 'Não deixou bens.';
  const nomes = h.partes.filter(p => p.valor > 0).map(p => `${vida.pessoas[p.pessoaId]?.nome ?? 'alguém'}${p.meacao ? ' (a metade do que construíram juntos, e mais uma parte)' : ''}`);
  const unicos = [...new Set(nomes)];
  return `Deixou ${dinheiroCurto(liq)}${h.bens.length ? ` — ${h.bens.slice(0, 3).join(', ')}` : ''}${unicos.length ? `, para ${unicos.slice(0, 4).join(', ').replace(/, ([^,]*)$/, ' e $1')}` : ''}.`;
}
