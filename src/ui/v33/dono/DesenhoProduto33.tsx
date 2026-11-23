/**
 * VIDA 35.3 · O DESENHO DE CADA PRODUTO — o moletom, o boné, o cachecol, o mousepad e a edição especial têm a sua arte
 * (as cores e a estampa, por temporada), como a camisa. A prévia reaproveita o desenho da camisa para as peças de
 * vestuário e desenha à parte o boné, o cachecol e o mousepad. Só desenho: quem decide o custo e o efeito é `loja33`.
 */
import type { DesignProduto33, EstampaProduto33, Produto33 } from '../../../motor/v33/dono/loja33';
import { ESTAMPAS_PRODUTO33 } from '../../../motor/v33/dono/loja33';
import type { PadraoCamisa33 } from '../../../motor/v33/dono/loja33';
import { SeletorDeCor33 } from './EditorIdentidade33';
import { DesenhoCamisa33 } from './Camisa33';

let seq = 0;
const PADRAO_DA_ESTAMPA: Record<EstampaProduto33, PadraoCamisa33> = { liso: 'liso', listras: 'listras', faixa: 'faixa', degrade: 'gradiente', logo: 'ombros' };
/** O modelo de camisa que cada peça de vestuário usa na prévia. */
const MODELO_DA_PECA: Partial<Record<Produto33, 'raglan' | 'v'>> = { agasalho: 'raglan', especial: 'v' };

/** Desenho de uma peça (SVG 120×120), com as cores e a estampa do desenho. */
export function DesenhoDoProduto33({ produto, design, nome, tamanho = 140 }: { produto: Produto33; design: Omit<DesignProduto33, 'ano'>; nome: string; tamanho?: number }) {
  if (MODELO_DA_PECA[produto]) {
    const camisa = { modelo: MODELO_DA_PECA[produto]!, padrao: PADRAO_DA_ESTAMPA[design.estampa], cor1: design.cor1, cor2: design.cor2, cor3: design.cor3, mangas: 'cor1' as const };
    return <DesenhoCamisa33 camisa={camisa} nome={nome} tamanho={tamanho} />;
  }
  const id = `prod33-${(seq = (seq + 1) % 1e6)}`;
  const { cor1: a, cor2: b, cor3: c, estampa } = design;
  const grad = (
    <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
  );
  const fundo = estampa === 'degrade' ? `url(#${id}-g)` : a;
  if (produto === 'bone') {
    return (
      <svg className="dono33__camisa" width={tamanho} height={tamanho} viewBox="0 0 120 120" role="img" aria-label={`${nome}: boné`}>
        <defs>{grad}</defs>
        <path d="M22 72 Q22 34 60 32 Q98 34 98 72 Z" fill={fundo} />
        {estampa === 'listras' && <path d="M58 33 Q63 52 58 72 L62 72 Q67 52 62 33 Z" fill={b} />}
        {estampa === 'faixa' && <path d="M22 72 Q40 40 60 32 L72 32 Q48 44 36 72 Z" fill={b} />}
        {estampa === 'logo' && <circle cx="60" cy="54" r="8" fill={b} />}
        <path d="M18 70 Q60 92 102 70 L108 80 Q60 104 12 80 Z" fill={c} />
        <path d="M22 72 Q22 34 60 32 Q98 34 98 72" fill="none" stroke="rgba(0,0,0,.4)" strokeWidth="1.2" />
      </svg>
    );
  }
  if (produto === 'cachecol') {
    return (
      <svg className="dono33__camisa" width={tamanho} height={tamanho} viewBox="0 0 120 120" role="img" aria-label={`${nome}: cachecol`}>
        <defs>{grad}</defs>
        <rect x="34" y="8" width="52" height="96" rx="8" fill={fundo} />
        {estampa === 'listras' && [0, 1, 2, 3, 4].map(k => <rect key={k} x="34" y={18 + k * 18} width="52" height="8" fill={b} />)}
        {estampa === 'faixa' && <path d="M34 30 L86 60 L86 74 L34 44 Z" fill={b} />}
        {estampa === 'logo' && <rect x="46" y="44" width="28" height="14" rx="3" fill={b} />}
        <rect x="34" y="96" width="52" height="16" fill={c} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map(k => <line key={k} x1={37 + k * 6} y1="104" x2={37 + k * 6} y2="112" stroke={b} strokeWidth="2" />)}
      </svg>
    );
  }
  if (produto === 'mousepad') {
    return (
      <svg className="dono33__camisa" width={tamanho} height={tamanho} viewBox="0 0 120 120" role="img" aria-label={`${nome}: mousepad`}>
        <defs>{grad}</defs>
        <rect x="6" y="34" width="108" height="56" rx="10" fill={fundo} stroke={c} strokeWidth="2" />
        {estampa === 'listras' && [0, 1, 2, 3, 4, 5, 6].map(k => <rect key={k} x={10 + k * 15} y="34" width="6" height="56" fill={b} />)}
        {estampa === 'faixa' && <path d="M6 70 L50 34 L72 34 L28 90 L6 90 Z" fill={b} />}
        {estampa === 'logo' && <text x="60" y="68" textAnchor="middle" fontSize="16" fontWeight="800" fill={b} fontFamily="system-ui, sans-serif">LOGO</text>}
      </svg>
    );
  }
  // Produto sem desenho próprio: um quadro com as cores (não deveria acontecer: cada produto tem o seu desenho acima).
  return (
    <svg className="dono33__camisa" width={tamanho} height={tamanho} viewBox="0 0 120 120" role="img" aria-label={nome}>
      <defs>{grad}</defs>
      <rect x="14" y="20" width="92" height="80" rx="10" fill={fundo} />
    </svg>
  );
}

/** O editor do desenho de um produto: as três cores e a estampa, com a prévia ao lado. */
export function EditorDoProduto33({ produto, nome, valor, mudar }: { produto: Produto33; nome: string; valor: Omit<DesignProduto33, 'ano'>; mudar: (d: Omit<DesignProduto33, 'ano'>) => void }) {
  return (
    <div className="dono33__camisa-area">
      <DesenhoDoProduto33 produto={produto} design={valor} nome={nome} />
      <div className="dono33__editor">
        <fieldset className="dono33__campo"><legend>Estampa</legend>
          <div className="dono33__fichas">{ESTAMPAS_PRODUTO33.map(e => <button key={e.id} type="button" className="chip" aria-pressed={valor.estampa === e.id} onClick={() => mudar({ ...valor, estampa: e.id })}>{e.nome}</button>)}</div>
        </fieldset>
        <SeletorDeCor33 rotulo="Cor principal" valor={valor.cor1} mudar={x => mudar({ ...valor, cor1: x })} />
        <SeletorDeCor33 rotulo="Segunda cor" valor={valor.cor2} mudar={x => mudar({ ...valor, cor2: x })} />
        <SeletorDeCor33 rotulo="Detalhes (acabamento)" valor={valor.cor3} mudar={x => mudar({ ...valor, cor3: x })} />
      </div>
    </div>
  );
}
