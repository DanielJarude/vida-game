/**
 * VIDA 30 · O OFÍCIO DEPOIS DE COMPETIR, na tela do trabalho: a casa (a emissora, a escolinha, o clube), os dois números
 * do ofício em barras, o jeito no ar, o técnico com quem se trabalha, os alunos (e quem já assinou com um clube) e os anos
 * em uma frase cada.
 */
import type { Vida } from '../../../motor/tipos';
import { familiaDoOficio30, nomeDoOficio30, ROTULOS30 } from '../../../motor/v30/oficio/oficio30';
import { anoDe } from '../../../motor/tempo';
import './oficio30.css';

const ESTILO = { tecnico: 'técnico', polemico: 'polêmico', humor: 'bem-humorado' } as const;
const TITULO = { midia: 'No ar', formacao: 'A formação', comissao: 'A comissão técnica', gestao: 'A gestão' } as const;

function Barra({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="oficio30__barra">
      <span>{rotulo}</span>
      <span className="oficio30__trilho" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(valor)} aria-label={rotulo}><i style={{ width: `${Math.max(3, valor)}%` }} className={valor >= 65 ? 'oficio30--bom' : valor <= 35 ? 'oficio30--ruim' : undefined} /></span>
      <strong>{Math.round(valor)}</strong>
    </div>
  );
}

export default function Oficio30({ vida }: { vida: Vida }) {
  const o = vida.oficio30;
  if (!o || familiaDoOficio30(vida.trabalho.atual?.ocupacaoId) !== o.familia || vida.trabalho.atual?.ocupacaoId !== o.oc) return null;
  const [ra, rb] = ROTULOS30[o.familia];
  const chefe = o.chefeId ? vida.pessoas[o.chefeId] : undefined;
  const alunos = o.alunos ?? [];
  const reveladas = alunos.filter(a => a.destino);
  const destaque = alunos.filter(a => !a.destino).sort((a, b) => b.talento - a.talento).slice(0, 4);
  return (
    <section className="oficio30" aria-labelledby="oficio30-t">
      <h3 id="oficio30-t" className="subtitulo">{TITULO[o.familia]} · {o.casa}</h3>
      <p className="nota">{nomeDoOficio30(vida)} desde {anoDe(o.desde)}{o.programa ? ` · programa: ${o.programa}` : ''}{o.estilo ? ` · jeito no ar: ${ESTILO[o.estilo]}` : ''}{chefe ? ` · técnico: ${chefe.nome}` : ''}{o.propria ? ' · o negócio é seu' : ''}</p>
      <div className="oficio30__barras"><Barra rotulo={ra} valor={o.a} /><Barra rotulo={rb} valor={o.b} /></div>
      {o.familia === 'formacao' && (
        <div className="oficio30__alunos">
          {destaque.length > 0 && <p><strong>Na turma:</strong> {destaque.map(a => `${a.nome} (${anoDe(vida.t) - a.nasc} anos${a.talento >= 70 ? ', talento raro' : ''}${a.indicado !== undefined ? ', indicado' : ''})`).join(' · ')}</p>}
          {reveladas.length > 0 && <p><strong>Já assinaram:</strong> {reveladas.map(a => `${a.nome} → ${a.destino}${a.tDestino ? ` (${anoDe(a.tDestino)})` : ''}`).join(' · ')}</p>}
        </div>
      )}
      {o.anos.length > 0 && (
        <ol className="oficio30__anos" aria-label="Os anos do ofício">
          {[...o.anos].reverse().slice(0, 6).map(x => <li key={`${x.ano}${x.texto}`} className={x.tom ? `oficio30__ano--${x.tom}` : undefined}><span>{x.ano}</span>{x.texto}</li>)}
        </ol>
      )}
    </section>
  );
}
