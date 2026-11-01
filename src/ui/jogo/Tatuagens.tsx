/**
 * HOTFIX 11.5.1 — O ESTÚDIO DE TATUAGEM (Você · Aparência). Escolher o desenho (pelo estilo), a parte do corpo e o lado,
 * ver como fica — de frente e de costas, sem a camisa — e tatuar; ver o que já tem, de que ano, e tirar no laser. O
 * motor decide o que cabe e quanto custa (`sistemas/tatuagens`); aqui é só a escolha e a prévia.
 */
import { useMemo, useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { anoDe } from '../../motor/tempo';
import { DESENHOS, desenhoDeTatuagem, LOCAIS, NOME_ESTILO, type EstiloDeTatuagem, type Lado, type LocalDeTatuagem } from '../../motor/dados/tatuagens';
import { IDADE_PARA_TATUAR, ondeEsta, precoDaRemocao, precoDaTatuagem, tatuagensDe, tatuagensNaFigura } from '../../motor/sistemas/tatuagens';
import { tipoDeCorpo } from '../../motor/sistemas/silhueta';
import { itensDaPessoa } from '../../motor/sistemas/estilo';
import { Figura, focoDaParte } from '../avatar/Figura';
import { BotaoAcao, Escolha } from '../comum';
import { dinheiroCurto } from '../leituraMaterial';

const TAMANHO = { 1: 'pequena', 2: 'média', 3: 'grande', 4: 'braço inteiro' } as const;

/**
 * VIDA 12.5 — a lupa: 0 = corpo inteiro; 1 = a região escolhida (com o entorno: o peito com os ombros, o braço do ombro
 * ao pulso); 2 e 3 = mais perto, para ver o traço. Trocar a parte do corpo volta para a região.
 */
const NIVEIS = ['Corpo inteiro', 'Região', 'Perto', 'Bem perto'] as const;
const PERTO = [1, 1, 1.7, 2.6];

export function EstudioDeTatuagem({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const i = idade(vida);
  const [estilo, setEstilo] = useState<EstiloDeTatuagem | ''>('');
  const [desenho, setDesenho] = useState(DESENHOS[0].id);
  const d = desenhoDeTatuagem(desenho)!;
  const [local, setLocal] = useState<LocalDeTatuagem>(d.locais[0]);
  const [lado, setLado] = useState<Lado>('d');
  const minhas = tatuagensDe(vida);
  const desenhos = DESENHOS.filter(x => !estilo || x.estilo === estilo);
  const localValido = d.locais.includes(local) ? local : d.locais[0];
  const prevista = { id: 'previa', desenho, local: localValido, ...(LOCAIS[localValido].lados ? { lado } : {}), anos: 0, clareou: 0 };
  const naPele = tatuagensNaFigura(vida);
  const comPrevia = [...naPele, prevista];
  const pecas = itensDaPessoa(vida).filter(x => x.usando);
  const acao: Acao = { tipo: 'tatuar', desenho, local: localValido, ...(LOCAIS[localValido].lados ? { lado } : {}) };
  const costasNaPrevia = !LOCAIS[localValido].frente;
  // A lupa acompanha a parte escolhida: o nível e o lado de olhar (as costas, quando a parte só aparece de costas).
  const [nivel, setNivel] = useState(1);
  const [vistaEscolhida, setVista] = useState<'frente' | 'costas' | null>(null);
  const [parteVista, setParteVista] = useState(`${localValido}:${lado}`);
  if (parteVista !== `${localValido}:${lado}`) { setParteVista(`${localValido}:${lado}`); setNivel(1); setVista(null); }
  const vistaPadrao: 'frente' | 'costas' = costasNaPrevia ? 'costas' : 'frente';
  const vista = vistaEscolhida ?? vistaPadrao;
  const ladoNaLupa = LOCAIS[localValido].lados ? lado : undefined;
  const fig = useMemo(() => ({ visual: vida.eu.visual, genero: vida.eu.genero, idade: i, semente: vida.eu.semente ?? 'eu', corpo: tipoDeCorpo(vida) }), [vida, i]);
  if (i < 16 && !minhas.length) return null;
  return (
    <section className="estudio-tatuagem" aria-labelledby="estudio-titulo">
      <h3 id="estudio-titulo" className="voce-subtitulo">Tatuagens</h3>
      {i < IDADE_PARA_TATUAR && <p className="nota">A partir dos {IDADE_PARA_TATUAR}: estúdio sério não tatua menor de idade.</p>}
      <div className="estudio-tatuagem__corpo">
        <Previa fig={fig} pecas={pecas} tatuagens={i >= IDADE_PARA_TATUAR ? comPrevia : naPele} local={localValido} lado={ladoNaLupa} vista={vista} nivel={nivel}
          aoNivel={setNivel} aoVista={setVista} costasNaPrevia={costasNaPrevia} nomeDaParte={ondeEsta(localValido, ladoNaLupa)} />
        {i >= IDADE_PARA_TATUAR && (
          <div className="estudio-tatuagem__escolhas">
            <Escolha rotulo="Estilo" valor={estilo} aoMudar={x => { setEstilo(x); const p = DESENHOS.find(y => !x || y.estilo === x); if (p) { setDesenho(p.id); setLocal(p.locais[0]); } }} opcoes={[{ id: '' as const, rotulo: 'Todos' }, ...(Object.keys(NOME_ESTILO) as EstiloDeTatuagem[]).map(e => ({ id: e, rotulo: NOME_ESTILO[e] }))]} />
            <label className="campo">
              <span className="campo__rotulo">Desenho</span>
              <select value={desenho} onChange={e => { setDesenho(e.target.value); const n = desenhoDeTatuagem(e.target.value)!; if (!n.locais.includes(local)) setLocal(n.locais[0]); }}>
                {desenhos.map(x => <option key={x.id} value={x.id}>{x.nome} — {TAMANHO[x.tamanho]}{x.colorida ? ', colorida' : ''} · {dinheiroCurto(precoDaTatuagem(vida, x.id))}</option>)}
              </select>
              <span className="campo__nota">{NOME_ESTILO[d.estilo]}: {d.descricao}</span>
            </label>
            <label className="campo">
              <span className="campo__rotulo">Onde</span>
              <select value={localValido} onChange={e => setLocal(e.target.value as LocalDeTatuagem)}>
                {d.locais.map(l => <option key={l} value={l}>{LOCAIS[l].nome.replace(/^./, x => x.toUpperCase())}</option>)}
              </select>
            </label>
            {LOCAIS[localValido].lados && <Escolha rotulo="Lado" valor={lado} aoMudar={setLado} opcoes={[{ id: 'd' as const, rotulo: 'Direito' }, { id: 'e' as const, rotulo: 'Esquerdo' }]} />}
            <BotaoAcao vida={vida} acao={acao} agir={agir} variante="principal">{`Tatuar ${ondeEsta(localValido, LOCAIS[localValido].lados ? lado : undefined)} (${dinheiroCurto(precoDaTatuagem(vida, desenho))})`}</BotaoAcao>
            <p className="nota">A prévia mostra o desenho já no lugar. Cada parte tem o espaço dela: o que não couber sem ficar por cima de outra tatuagem, o estúdio não faz.</p>
          </div>
        )}
      </div>
      {minhas.length > 0 && (
        <ul className="estudio-tatuagem__lista">
          {minhas.map(t => {
            const x = desenhoDeTatuagem(t.desenho);
            return (
              <li key={t.id} data-tatuagem={t.desenho}>
                <span><strong>{x?.nome ?? t.desenho}</strong> {ondeEsta(t.local, t.lado)} <span className="nota">· desde {anoDe(t.t)}{t.removida !== undefined ? ' · saindo no laser' : ''}</span></span>
                {t.removida === undefined && <BotaoAcao vida={vida} acao={{ tipo: 'remover_tatuagem', id: t.id }} agir={agir} variante="discreto">{`Tirar no laser (${dinheiroCurto(precoDaRemocao(vida, t))})`}</BotaoAcao>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type Fig = { visual: Vida['eu']['visual']; genero: Vida['eu']['genero']; idade: number; semente: string; corpo: ReturnType<typeof tipoDeCorpo> };

/**
 * VIDA 12.5 — A PRÉVIA DO ESTÚDIO: a lupa grande (a parte do corpo escolhida, de perto, com as tatuagens que já estão
 * ali — para ver desenho, tamanho, proporção e vizinhança) e, ao lado, o corpo inteiro de frente e de costas como
 * referência, com o retângulo de onde a lupa está olhando. Tocar numa das figuras inteiras troca o lado da lupa.
 */
function Previa({ fig, pecas, tatuagens, local, lado, vista, nivel, aoNivel, aoVista, costasNaPrevia, nomeDaParte }: {
  fig: Fig; pecas: { itemId: string; id: string }[]; tatuagens: Parameters<typeof Figura>[0]['tatuagens']; local: LocalDeTatuagem; lado: Lado | undefined;
  vista: 'frente' | 'costas'; nivel: number; aoNivel: (n: number) => void; aoVista: (v: 'frente' | 'costas') => void; costasNaPrevia: boolean; nomeDaParte: string;
}) {
  const foco = focoDaParte(fig.genero, fig.corpo, fig.idade, nivel === 0 ? 'inteiro' : local, lado, vista, PERTO[nivel]);
  const daVista = (v: 'frente' | 'costas') => (nivel > 0 && v === vista ? foco : undefined);
  const visivel = vista === 'frente' ? LOCAIS[local].frente : LOCAIS[local].costas;
  return (
    <div className="estudio-tatuagem__previa" aria-label="Prévia">
      <figure className="estudio-tatuagem__lupa" data-nivel={nivel} data-vista={vista} data-local={local}>
        <Figura {...fig} pecas={pecas} semCima vista={vista} tatuagens={tatuagens} largura={300} semFundo foco={foco}
          rotulo={`${nivel === 0 ? 'Corpo inteiro' : `De perto: ${nomeDaParte}`}, ${vista === 'frente' ? 'de frente' : 'de costas'}`} />
        <figcaption className="nota">{nivel === 0 ? 'Corpo inteiro' : nomeDaParte.replace(/^no |^na |^nas |^nos /, '').replace(/^./, x => x.toUpperCase())} · {vista === 'frente' ? 'de frente' : 'de costas'}{!visivel ? ' (não aparece deste lado)' : ''}</figcaption>
        <div className="estudio-tatuagem__lupa-controles" role="group" aria-label="Aproximar">
          <button type="button" className="botao botao--discreto" onClick={() => aoNivel(Math.max(0, nivel - 1))} disabled={nivel === 0} aria-label="Afastar">−</button>
          <span className="estudio-tatuagem__nivel" aria-live="polite">{NIVEIS[nivel]}</span>
          <button type="button" className="botao botao--discreto" onClick={() => aoNivel(Math.min(NIVEIS.length - 1, nivel + 1))} disabled={nivel === NIVEIS.length - 1} aria-label="Aproximar">+</button>
          {nivel !== 0 && <button type="button" className="botao botao--discreto" onClick={() => aoNivel(0)}>Corpo inteiro</button>}
          {nivel === 0 && <button type="button" className="botao botao--discreto" onClick={() => aoNivel(1)}>Ver a região</button>}
        </div>
      </figure>
      <div className="estudio-tatuagem__referencia" role="group" aria-label="Frente e costas">
        {(['frente', 'costas'] as const).map(v => (
          <button key={v} type="button" className={`estudio-tatuagem__lado${v === vista ? ' estudio-tatuagem__lado--ativo' : ''}`} aria-pressed={v === vista} onClick={() => aoVista(v)}>
            <Figura {...fig} pecas={pecas} semCima vista={v} tatuagens={tatuagens} largura={64} semFundo destaque={daVista(v)} rotulo={v === 'frente' ? 'De frente' : 'De costas'} />
            <span className="nota">{v === 'frente' ? 'De frente' : `De costas${costasNaPrevia ? ' · onde ela fica' : ''}`}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
