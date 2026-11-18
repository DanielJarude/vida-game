/**
 * VIDA 24 — Nascer · O CORPO DE NASCENÇA: as predisposições do corpo, escolhidas antes de nascer (como os atributos
 * iniciais). Três jeitos: puxar dos pais (com variação — nunca a cópia de um deles), escolher eixo a eixo (ou por uma
 * forma de partida) ou ao acaso (sem olhar os pais).
 *
 * VIDA 26: a tela diz o que é cada coisa — HERDADO (a estrutura: não muda depois de adulto), TENDÊNCIA (onde a gordura
 * vai: a quantidade é da vida), FACILIDADE (quanto o treino vira músculo) — e o que cada escolha faz nas CAPACIDADES
 * (força, velocidade, alcance...: `v26/corpo/capacidades26`, a mesma conta que o esporte lê). A escolha é por degraus
 * com nome (não um slider mudo), e o painel "o que este corpo favorece" mostra as capacidades aos 25, sem treino e
 * treinando: a predisposição não é destino.
 */
import type { Genero, Visual } from '../../motor/tipos';
import { EIXOS_DO_CORPO, formaDe, FORMAS23, gravarCorpo23, lerCorpo23, NEUTRA23, PELOS23, type Constituicao } from '../../motor/v23/corpo/corpo23';
import { alvo24, descreverPredisposicoes24, GRUPOS24, PAPEL24, PREDISPOSICOES24, type ModoDoCorpo24 } from '../../motor/v24/corpo/corpo24';
import { capacidades26, EIXO_NAS_CAPACIDADES26, leituraCapacidade26, NOME_CAPACIDADE26, type Capacidade26 } from '../../motor/v26/corpo/capacidades26';
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
/** A natureza de cada grupo, dita uma vez (herdado, tendência, facilidade). */
const NATUREZA: Record<'estrutura' | 'distribuicao' | 'musculo', { selo: string; classe: string }> = {
  estrutura: { selo: 'Herdado · não muda depois de adulto', classe: 'herdado' },
  distribuicao: { selo: 'Tendência · a quantidade é da vida', classe: 'tendencia' },
  musculo: { selo: 'Facilidade · o treino decide', classe: 'facilidade' }
};
const CAPS: Capacidade26[] = ['forca', 'velocidade', 'aceleracao', 'resistencia', 'agilidade', 'impulsao', 'equilibrio', 'alcance'];

export function CorpoDeNascenca({ escolha, aoMudar, genero, previa, visual }: Props) {
  const atual = escolha.modo === 'escolher' && escolha.c ? lerCorpo23(escolha.c) : lerCorpo23(previa?.eu.corpo23 ?? visual.corpo23);
  const pelos = escolha.modo === 'escolher' && escolha.pelos !== undefined ? escolha.pelos : previa?.eu.pelos23 ?? 0;
  const mudar = (c: Constituicao, p = pelos) => aoMudar({ modo: 'escolher', c: gravarCorpo23(c) ?? '222222222222', pelos: p });
  const forma = formaDe(atual);
  const media = genero === 'feminino' ? 163 : genero === 'masculino' ? 176 : 169.5;
  const dp = genero === 'feminino' ? 7 : 8;
  const z = previa ? Math.max(-2.2, Math.min(2.2, (previa.estatura - media) / dp)) : atual.estatura * 0.8;
  const vis: Visual = { ...visual, corpo23: gravarCorpo23(atual) ?? '222222222222', pelos23: pelos || undefined };
  // A composição de cada idade: a de quem vive sem treinar (e, aos 30, a de quem treina) — a mesma conta do motor.
  const comp = (i: number, treina = false) => {
    const a = alvo24({ idade: i, forca: treina ? 1 : 0, cardio: treina ? 0.6 : 0, sedentario: false, bebeMuito: false, forma: treina ? 70 : 45, c: atual });
    return { g: Math.round(a.g * 100) / 100, m: Math.round(a.m * 100) / 100 };
  };
  const idades: [number, string, boolean][] = [[6, 'aos 6', false], [16, 'aos 16', false], [30, 'aos 30, sem treino', false], [30, 'aos 30, treinando', true]];
  const dosPais = [previa?.mae?.corpo23 && `da mãe, ${descreverPredisposicoes24(lerCorpo23(previa.mae.corpo23), 3)}`, previa?.pai?.corpo23 && `do pai, ${descreverPredisposicoes24(lerCorpo23(previa.pai.corpo23), 3)}`].filter(Boolean);
  // As capacidades aos 25 (a mesma conta do esporte), sem treino e treinando.
  const cap = (treina: boolean) => { const k = comp(25, treina); return capacidades26({ idade: 25, c: atual, g: k.g, m: k.m, forma: treina ? 72 : 45, saude: 85, zAgora: z, zAdulta: z }); };
  const sem = cap(false), com = cap(true);
  return (
    <fieldset className="campo corpo-nascenca" data-corpo-nascenca={escolha.modo}>
      <legend className="campo__rotulo">Corpo de nascença</legend>
      <Escolha rotulo="Corpo de nascença" valor={escolha.modo} aoMudar={m => (m === 'escolher' ? mudar(atual) : aoMudar({ modo: m }))}
        opcoes={[{ id: 'heranca', rotulo: 'Puxar dos pais' }, { id: 'escolher', rotulo: 'Escolher' }, { id: 'acaso', rotulo: 'Ao acaso' }]} />
      <p className="nota">{NOTA[escolha.modo]} Não é o atributo Físico (força e fôlego): é a estrutura, as proporções e as tendências do corpo.</p>
      <ul className="cn26-legenda" aria-label="O que é cada coisa">
        <li className="cn26-selo cn26-selo--herdado"><b>Herdado</b> a estrutura: altura, ossos, ombros, tórax, quadril, pernas</li>
        <li className="cn26-selo cn26-selo--vida"><b>Muda com a vida</b> músculo, gordura, condicionamento — treino, comida, hábitos, idade</li>
        <li className="cn26-selo cn26-selo--capacidade"><b>Capacidade</b> força, velocidade, alcance...: o corpo herdado + o que a vida fez dele</li>
      </ul>
      {escolha.modo === 'heranca' && dosPais.length > 0 && <p className="nota corpo-nascenca__pais">Traços de corpo {dosPais.join('; ')}.</p>}
      <div className="cn26-previa">
        <div className="corpo-nascenca__idades" aria-label="O corpo nas idades (prévia)">
          {idades.map(([i, r, t]) => (
            <figure key={r} className="corpo-nascenca__fig" data-idade={i}>
              <Figura visual={vis} genero={genero} idade={i} semente="eu" corpo={{ tipo: 'mediano', c: vis.corpo23, estatura: z, comp: comp(i, t) }} pecas={[]} largura={LARGURA_DE_REFERENCIA * 0.62} semFundo rotulo={`O corpo ${r}`} />
              <figcaption>{r}</figcaption>
            </figure>
          ))}
        </div>
        <div className="cn26-caps" aria-label="O que este corpo favorece, aos 25 anos">
          <p className="cn26-caps__titulo">O que este corpo favorece <small>aos 25 · sem treino → treinando</small></p>
          <ul>
            {CAPS.map(k => (
              <li key={k} className="cn26-cap" data-capacidade={k}>
                <span className="cn26-cap__nome">{NOME_CAPACIDADE26[k]}</span>
                <span className="cn26-cap__barra" aria-hidden><i style={{ width: `${sem[k]}%` }} /><i className="cn26-cap__com" style={{ width: `${Math.max(0, com[k] - sem[k])}%`, left: `${sem[k]}%` }} /></span>
                <span className="cn26-cap__valor">{leituraCapacidade26(sem[k])} → {leituraCapacidade26(com[k])}</span>
              </li>
            ))}
          </ul>
          <p className="nota">Tendência, não destino: nenhum corpo impede de tentar um esporte — dá vantagens em uns, pede compensação em outros.</p>
        </div>
      </div>
      <p className="nota">Prévia sem roupa de sair (a de sempre). {previa ? `Altura adulta prevista: ${(previa.estatura / 100).toFixed(2).replace('.', ',')} m.` : ''} Tendências: {descreverPredisposicoes24(atual)}.</p>
      {escolha.modo === 'escolher' && (
        <div className="corpo-nascenca__escolher">
          <span className="campo__rotulo">Forma de partida</span>
          <div className="corpo-nascenca__formas" role="group" aria-label="Formas de partida">
            {FORMAS23.map(f => <button key={f.id} type="button" className={`filtro${forma === f.id ? ' filtro--ativo' : ''}`} aria-pressed={forma === f.id} title={f.nota} onClick={() => mudar({ ...NEUTRA23, ...f.c })}>{f.nome}</button>)}
          </div>
          {GRUPOS24.map(gr => (
            <div key={gr.id} className={`corpo-nascenca__grupo cn26-grupo cn26-grupo--${NATUREZA[gr.id].classe}`} role="group" aria-label={gr.nome}>
              <div className="cn26-grupo__cabeca">
                <span className="corpo-nascenca__grupo-nome">{gr.nome}</span>
                <span className={`cn26-selo cn26-selo--${NATUREZA[gr.id].classe}`}>{NATUREZA[gr.id].selo}</span>
              </div>
              <span className="campo__nota">{gr.nota}</span>
              {EIXOS_DO_CORPO.filter(e => PAPEL24[e] === gr.id).map(e => (
                <div key={e} className="corpo-nascenca__eixo cn26-eixo" data-eixo={e} role="radiogroup" aria-label={PREDISPOSICOES24[e].nome}>
                  <span className="cn26-eixo__nome">{PREDISPOSICOES24[e].nome}: <b className="corpo-nascenca__valor">{PREDISPOSICOES24[e].niveis[atual[e] + 2]}</b></span>
                  <span className="cn26-degraus">
                    {PREDISPOSICOES24[e].niveis.map((n, k) => (
                      <label key={n} className={`cn26-degrau${atual[e] === k - 2 ? ' cn26-degrau--ativo' : ''}`} title={n}>
                        <input type="radio" name={`eixo-${e}`} value={k - 2} checked={atual[e] === k - 2} aria-label={n} onChange={ev => mudar({ ...atual, [e]: Number(ev.target.value) })} />
                        <span aria-hidden />
                      </label>
                    ))}
                  </span>
                  <span className="cn26-eixo__efeito">{EIXO_NAS_CAPACIDADES26[e]}</span>
                </div>
              ))}
            </div>
          ))}
          <div className="corpo-nascenca__grupo" role="group" aria-label="Pelos do corpo">
            <span className="corpo-nascenca__grupo-nome">Pelos do corpo</span>
            <span className="campo__nota">Aparecem na puberdade. Depois, dá para aparar ou remover.</span>
            <Escolha rotulo="Pelos do corpo" valor={String(pelos)} aoMudar={x => mudar(atual, Number(x))} opcoes={PELOS23.map((n, k) => ({ id: String(k), rotulo: n.charAt(0).toUpperCase() + n.slice(1) }))} />
          </div>
          <div className="corpo-nascenca__grupo cn26-grupo cn26-grupo--vida" role="note">
            <div className="cn26-grupo__cabeca"><span className="corpo-nascenca__grupo-nome">Composição e condição física</span><span className="cn26-selo cn26-selo--vida">Muda com a vida · não se escolhe</span></div>
            <span className="campo__nota">Músculo, gordura e condicionamento não vêm prontos: o bebê nasce com os de bebê, e o resto é treino, comida, hábitos, saúde e idade. A prévia acima mostra a mesma pessoa aos 30, sem treino e treinando.</span>
          </div>
        </div>
      )}
    </fieldset>
  );
}
