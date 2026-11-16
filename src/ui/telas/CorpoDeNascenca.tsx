/**
 * VIDA 24 — Nascer · O CORPO DE NASCENÇA: as predisposições do corpo, escolhidas antes de nascer (como os atributos
 * iniciais). Três jeitos: puxar dos pais (com variação — nunca a cópia de um deles), escolher eixo a eixo (ou por uma
 * forma de partida) ou ao acaso (sem olhar os pais). Não é o atributo Físico (força, fôlego): é estrutura, proporções e
 * tendências. A prévia mostra o corpo nas idades — a criança com corpo de criança — e, aos 30, sem treino e treinando:
 * a predisposição não é destino.
 */
import type { Genero, Visual } from '../../motor/tipos';
import { EIXOS_DO_CORPO, formaDe, FORMAS23, gravarCorpo23, lerCorpo23, NEUTRA23, PELOS23, type Constituicao } from '../../motor/v23/corpo/corpo23';
import { alvo24, descreverPredisposicoes24, GRUPOS24, PAPEL24, PREDISPOSICOES24, type ModoDoCorpo24 } from '../../motor/v24/corpo/corpo24';
import { Escolha } from '../comum';
import { FiguraSobDemanda as Figura } from '../avatar/figuraSobDemanda';
import { LARGURA_DE_REFERENCIA } from '../avatar/referencia';
import './corpoDeNascenca.css';

export interface EscolhaDoCorpo { modo: ModoDoCorpo24; c?: string; pelos?: number }
interface Props {
  escolha: EscolhaDoCorpo;
  aoMudar: (e: EscolhaDoCorpo) => void;
  genero: Genero;
  previa?: { eu: Visual; mae?: Visual; pai?: Visual; estatura: number };
  visual: Visual;
}

const NOTA: Record<ModoDoCorpo24, string> = {
  heranca: 'O corpo puxa os pais — a média dos dois, com variação: parecido, nunca igual a um deles.',
  escolher: 'Você escolhe as tendências. São ponto de partida: a vida (treino, comida, hábitos, idade) faz o resto.',
  acaso: 'Um corpo sorteado, sem olhar os pais.'
};

export function CorpoDeNascenca({ escolha, aoMudar, genero, previa, visual }: Props) {
  const atual = escolha.modo === 'escolher' && escolha.c ? lerCorpo23(escolha.c) : lerCorpo23(previa?.eu.corpo23 ?? visual.corpo23);
  const pelos = escolha.modo === 'escolher' && escolha.pelos !== undefined ? escolha.pelos : previa?.eu.pelos23 ?? 0;
  const mudar = (c: Constituicao, p = pelos) => aoMudar({ modo: 'escolher', c: gravarCorpo23(c) ?? '222222222222', pelos: p });
  const forma = formaDe(atual);
  const media = genero === 'feminino' ? 163 : genero === 'masculino' ? 176 : 169.5;
  const z = previa ? Math.max(-2.2, Math.min(2.2, (previa.estatura - media) / 7)) : 0;
  const vis: Visual = { ...visual, corpo23: gravarCorpo23(atual) ?? '222222222222', pelos23: pelos || undefined };
  // A composição de cada idade: a de quem vive sem treinar (e, aos 30, a de quem treina) — a mesma conta do motor.
  const comp = (i: number, treina = false) => {
    const a = alvo24({ idade: i, forca: treina ? 1 : 0, cardio: treina ? 0.6 : 0, sedentario: false, bebeMuito: false, forma: treina ? 70 : 45, c: atual });
    return { g: Math.round(a.g * 100) / 100, m: Math.round(a.m * 100) / 100 };
  };
  const idades: [number, string, boolean][] = [[6, 'aos 6', false], [16, 'aos 16', false], [30, 'aos 30, sem treino', false], [30, 'aos 30, treinando', true]];
  const dosPais = [previa?.mae?.corpo23 && `da mãe, ${descreverPredisposicoes24(lerCorpo23(previa.mae.corpo23), 3)}`, previa?.pai?.corpo23 && `do pai, ${descreverPredisposicoes24(lerCorpo23(previa.pai.corpo23), 3)}`].filter(Boolean);
  return (
    <fieldset className="campo corpo-nascenca" data-corpo-nascenca={escolha.modo}>
      <legend className="campo__rotulo">Corpo de nascença</legend>
      <Escolha rotulo="Corpo de nascença" valor={escolha.modo} aoMudar={m => (m === 'escolher' ? mudar(atual) : aoMudar({ modo: m }))}
        opcoes={[{ id: 'heranca', rotulo: 'Puxar dos pais' }, { id: 'escolher', rotulo: 'Escolher' }, { id: 'acaso', rotulo: 'Ao acaso' }]} />
      <p className="nota">{NOTA[escolha.modo]} Não é o atributo Físico (força e fôlego): é a estrutura, as proporções e as tendências do corpo.</p>
      {escolha.modo === 'heranca' && dosPais.length > 0 && <p className="nota corpo-nascenca__pais">Traços de corpo {dosPais.join('; ')}.</p>}
      <div className="corpo-nascenca__idades" aria-label="O corpo nas idades (prévia)">
        {idades.map(([i, r, t]) => (
          <figure key={r} className="corpo-nascenca__fig" data-idade={i}>
            <Figura visual={vis} genero={genero} idade={i} semente="eu" corpo={{ tipo: 'mediano', c: vis.corpo23, estatura: z, comp: comp(i, t) }} pecas={[]} largura={LARGURA_DE_REFERENCIA * 0.62} semFundo rotulo={`O corpo ${r}`} />
            <figcaption>{r}</figcaption>
          </figure>
        ))}
      </div>
      <p className="nota">Prévia sem roupa de sair (a de sempre). {previa ? `Altura adulta prevista: ${(previa.estatura / 100).toFixed(2).replace('.', ',')} m.` : ''} Tendências: {descreverPredisposicoes24(atual)}.</p>
      {escolha.modo === 'escolher' && (
        <div className="corpo-nascenca__escolher">
          <span className="campo__rotulo">Forma de partida</span>
          <div className="corpo-nascenca__formas" role="group" aria-label="Formas de partida">
            {FORMAS23.map(f => <button key={f.id} type="button" className={`filtro${forma === f.id ? ' filtro--ativo' : ''}`} aria-pressed={forma === f.id} title={f.nota} onClick={() => mudar({ ...NEUTRA23, ...f.c })}>{f.nome}</button>)}
          </div>
          {GRUPOS24.map(gr => (
            <div key={gr.id} className="corpo-nascenca__grupo" role="group" aria-label={gr.nome}>
              <span className="corpo-nascenca__grupo-nome">{gr.nome}</span>
              <span className="campo__nota">{gr.nota}</span>
              {EIXOS_DO_CORPO.filter(e => PAPEL24[e] === gr.id).map(e => (
                <label key={e} className="corpo-nascenca__eixo" data-eixo={e}>
                  <span>{PREDISPOSICOES24[e].nome}</span>
                  <input type="range" min={-2} max={2} step={1} value={atual[e]} aria-valuetext={PREDISPOSICOES24[e].niveis[atual[e] + 2]} onChange={ev => mudar({ ...atual, [e]: Number(ev.target.value) })} />
                  <span className="corpo-nascenca__valor">{PREDISPOSICOES24[e].niveis[atual[e] + 2]}</span>
                </label>
              ))}
            </div>
          ))}
          <div className="corpo-nascenca__grupo" role="group" aria-label="Pelos do corpo">
            <span className="corpo-nascenca__grupo-nome">Pelos do corpo</span>
            <span className="campo__nota">Aparecem na puberdade. Depois, dá para aparar ou remover.</span>
            <Escolha rotulo="Pelos do corpo" valor={String(pelos)} aoMudar={x => mudar(atual, Number(x))} opcoes={PELOS23.map((n, k) => ({ id: String(k), rotulo: n.charAt(0).toUpperCase() + n.slice(1) }))} />
          </div>
        </div>
      )}
    </fieldset>
  );
}
