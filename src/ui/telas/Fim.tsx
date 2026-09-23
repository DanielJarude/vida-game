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

export function Fim({ vida, c }: { vida: Vida; c: ControleVida }) {
  const i = idade(vida);
  const g = vida.eu.tratamento ?? vida.eu.genero;
  const nFilhos = Object.values(vida.vinculos).filter(v => v.parentesco === 'filho').length;
  const empregos = [...vida.trabalho.historico.map(h => h.ocupacaoId), ...(vida.trabalho.atual ? [vida.trabalho.atual.ocupacaoId] : [])];
  const principal = empregos.length ? nomeOcupacaoId(vida, empregos.sort((a, b) => empregos.filter(x => x === b).length - empregos.filter(x => x === a).length)[0]) : null;
  const cidades = new Set(vida.biografia.filter(e => e.tema === 'lugar' && /Mudou-se/.test(e.texto)).map(e => e.texto));
  const perto = vinculosVivos(vida).filter(x => !x.p.especie).sort((a, b) => b.vin.proximidade - a.vin.proximidade).slice(0, 5);
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
          <li>{ROTULO_ESCOLARIDADE[vida.educacao.escolaridade][0].toUpperCase() + ROTULO_ESCOLARIDADE[vida.educacao.escolaridade].slice(1)}{vida.educacao.concluidos.length ? ` — ${vida.educacao.concluidos.map(c => c.nome).join(', ')}` : ''}.</li>
          {principal && <li>Trabalhou sobretudo como {principal}.</li>}
          <li>{nFilhos === 0 ? 'Não teve filhos.' : nFilhos === 1 ? `Teve um filho: ${filhos(vida)[0]?.nome ?? ''}.` : `Teve ${nFilhos} filhos.`}</li>
          {cidades.size > 0 && <li>Mudou de cidade {cidades.size === 1 ? 'uma vez' : `${cidades.size} vezes`}.</li>}
          <li>Deixou {dinheiroCurto(Math.max(0, patrimonio(vida)))}{patrimonio(vida) < 0 ? ' e dívidas' : ''}.</li>
          {tracos.length > 0 && <li>Quem conviveu lembra de alguém {tracos.join(', ').replace(/, ([^,]*)$/, ' e $1')}.</li>}
        </ul>
        {perto.length > 0 && (
          <>
            <h2>Quem ficou</h2>
            <ul className="fim__pessoas">
              {perto.map(({ p, vin }) => <li key={p.id}>{p.nome} — {rotuloDe(vida, p, vin)}</li>)}
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
