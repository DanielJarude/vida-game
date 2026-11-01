/**
 * HOTFIX 11.5.1 — O CORPO DA ABA COMPRAS (sob demanda): o começo (um cartão por segmento) e o segmento por dentro (o
 * filtro pela categoria; as lojas pelo tipo — especializadas, grandes lojas, internet —, ou os lugares do grupo), com as
 * vitrines de sempre (a fachada do lugar, o que há nela, a partir de quanto, o que já é seu).
 */
import type { Acao } from '../../../motor/acoes';
import type { Vida } from '../../../motor/tipos';
import { idade } from '../../../motor/nucleo';
import { NOME_CATEGORIA, type CategoriaDeProduto, type Estabelecimento } from '../../../motor/dados/lojas';
import { SEGMENTOS, type SegmentoDeCompras as IdDoSegmento } from '../../../motor/sistemas/lojas';
import { habilitacaoDaVida, leituraDaAutoescola } from '../../../motor/sistemas/autoescola';
import { BotaoAcao, Escolha } from '../../comum';
import { dinheiroCurto } from '../../leituraMaterial';
import { Fachada } from '../../ilustracao/Fachada';
import { PORTA_DA_FACHADA } from '../../ilustracao/lugares';
import { fachadaDoLugar, type LugarNoSegmento, type Vitrine } from '../Compras';
import type { QualLugar } from './Lugares';
import type { ReactNode } from 'react';

const TITULO_DO_TIPO: Record<Estabelecimento['tipo'], string> = { especializada: 'Lojas especializadas', departamento: 'Grandes lojas e lojas de departamento', online: 'Pela internet' };
/** A vitrine tem objetos de verdade na frente (senão, a fachada mostra o interior da loja). */
const temObjetos = (v: ReactNode) => (Array.isArray(v) ? v.some(Boolean) : Boolean(v));

function CartaoVitrine({ x, i, abrir }: { x: Vitrine; i: number; abrir: (l: QualLugar) => void }) {
  const cedo = i < x.idadeMin;
  return (
    <li className={`vitrine${cedo ? ' vitrine--cedo' : ''}`}>
      <button type="button" className="vitrine__abrir" onClick={() => abrir(x.id)} disabled={cedo} aria-describedby={cedo ? `cedo-${x.id}` : undefined}>
        {/* REWORK 9: na loja de porta lateral, os objetos ficam na frente do vidro (no máximo dois), nunca na porta. */}
        <span className="vitrine__objetos" aria-hidden data-porta={PORTA_DA_FACHADA[fachadaDoLugar(x.id)] ?? undefined}>
          <Fachada lugar={fachadaDoLugar(x.id)} largura={360} altura={112} vazia={!temObjetos(x.vitrine)} className="vitrine__fachada" />
          {PORTA_DA_FACHADA[fachadaDoLugar(x.id)] && temObjetos(x.vitrine)
            ? <span className="vitrine__produtos">{Array.isArray(x.vitrine) ? x.vitrine.slice(0, 2) : x.vitrine}</span>
            : x.vitrine}
        </span>
        <span className="vitrine__texto">
          <span className="vitrine__nome">{x.nome}</span>
          <span className="vitrine__oque" id={cedo ? `cedo-${x.id}` : undefined}>{cedo ? x.porque : x.oque}</span>
          {!cedo && (x.preco || x.online) && <span className="vitrine__preco">{x.preco}{x.online ? `${x.preco ? ' · ' : ''}pela internet` : ''}</span>}
          {!cedo && x.seu && <span className="vitrine__seu">{x.seu}</span>}
          {!cedo && x.rende && <span className="vitrine__rende">{x.rende}</span>}
        </span>
      </button>
    </li>
  );
}

/** O começo da aba: um cartão por segmento (quantos lugares, a partir de quanto, o que já é seu dali). */
export function InicioDeCompras({ vida, segmentos, escolher }: { vida: Vida; segmentos: { s: (typeof SEGMENTOS)[number]; lugares: LugarNoSegmento[] }[]; escolher: (id: IdDoSegmento) => void }) {
  const i = idade(vida);
  return (
    <section className="compras-inicio" aria-label="Os segmentos">
      <ul className="compras-inicio__lista">
        {segmentos.map(({ s, lugares }) => {
          const abertos = lugares.filter(l => i >= l.x.idadeMin);
          const lojas = abertos.filter(l => l.x.tipoLoja);
          const seus = abertos.filter(l => l.x.seu).length;
          const precos = abertos.map(l => l.x.precoMin).filter((p): p is number => p !== undefined);
          return (
            <li key={s.id}>
              <button type="button" className={`compras-inicio__cartao compras-inicio__cartao--${s.id}`} onClick={() => escolher(s.id)} disabled={!abertos.length}>
                <span className="compras-inicio__nome">{s.nome}</span>
                <span className="compras-inicio__frase">{s.frase}</span>
                <span className="compras-inicio__meta">{abertos.length ? `${abertos.length} ${abertos.length === 1 ? 'lugar' : 'lugares'}${lojas.length ? ` · ${lojas.filter(l => l.x.tipoLoja !== 'online').length} na cidade, ${lojas.filter(l => l.x.tipoLoja === 'online').length} pela internet` : ''}` : `mais tarde (aos ${Math.min(...lugares.map(l => l.x.idadeMin))})`}{seus ? ` · você já tem coisas de ${seus}` : ''}</span>
                {precos.length > 0 && <span className="compras-inicio__preco">{`a partir de ${dinheiroCurto(Math.min(...precos))}`}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Um segmento por dentro: o filtro pela categoria (quando há mais de uma), e as lojas pelo tipo — ou os lugares do grupo. */
export function SegmentoDeCompras({ vida, agir, abrir, segmento, lugares, categoria, mudarCategoria }: { vida: Vida; agir: (a: Acao) => boolean; abrir: (l: QualLugar) => void; segmento: (typeof SEGMENTOS)[number]; lugares: LugarNoSegmento[]; categoria: string; mudarCategoria: (c: string) => void }) {
  const i = idade(vida);
  const hab = habilitacaoDaVida(vida);
  const cats = segmento.categorias.filter(c => lugares.some(l => l.x.categorias?.includes(c)));
  const cat = cats.includes(categoria as CategoriaDeProduto) ? categoria as CategoriaDeProduto : '';
  const visiveis = lugares.filter(l => !cat || !l.x.categorias || l.x.categorias.includes(cat));
  // Os blocos: as lojas pelo tipo (na ordem: especializadas, grandes lojas, internet); o resto, pelo grupo de sempre.
  const blocos: { id: string; titulo: string; xs: LugarNoSegmento[] }[] = [];
  for (const l of visiveis) {
    const id = l.x.tipoLoja ?? l.grupoId;
    const titulo = l.x.tipoLoja ? TITULO_DO_TIPO[l.x.tipoLoja] : l.grupo;
    let b = blocos.find(y => y.id === id);
    if (!b) { b = { id, titulo, xs: [] }; blocos.push(b); }
    b.xs.push(l);
  }
  const ordem = ['especializada', 'departamento', 'online'];
  blocos.sort((a, b) => (ordem.indexOf(a.id) + 1 || 9) - (ordem.indexOf(b.id) + 1 || 9));
  return (
    <section className={`compras-segmento compras-segmento--${segmento.id}`} aria-labelledby={`segmento-${segmento.id}`}>
      <h2 id={`segmento-${segmento.id}`} className="compras-segmento__titulo">{segmento.nome}</h2>
      <p className="nota">{segmento.frase}.</p>
      {cats.length > 1 && (
        <div className="compras-segmento__categorias">
          <Escolha rotulo="Categoria" valor={cat} aoMudar={c => mudarCategoria(c)} opcoes={[{ id: '' as const, rotulo: 'Tudo' }, ...cats.map(c => ({ id: c, rotulo: NOME_CATEGORIA[c] }))]} />
        </div>
      )}
      {blocos.map(b => {
        const abertos = b.xs.filter(l => i >= l.x.idadeMin);
        const cedo = b.xs.filter(l => i < l.x.idadeMin);
        return (
          <section key={b.id} className={`vitrines vitrines--${b.id}`} aria-labelledby={`vitrines-${segmento.id}-${b.id}`}>
            <h3 id={`vitrines-${segmento.id}-${b.id}`} className="vitrines__titulo">{b.titulo}</h3>
            {abertos.length > 0 && <ul className="vitrines__lista">{abertos.map(l => <CartaoVitrine key={l.x.id} x={l.x} i={i} abrir={abrir} />)}</ul>}
            {cedo.length > 0 && <p className="vitrines__depois">{abertos.length ? 'Mais tarde: ' : ''}{cedo.map((x, k) => <span key={x.x.id}>{k ? ' · ' : ''}{x.x.nome.toLowerCase()} <span className="nota">(aos {x.x.idadeMin})</span></span>)}</p>}
          </section>
        );
      })}
      {segmento.id === 'veiculos' && i >= hab.comeca - 1 && <BotaoAcao vida={vida} acao={{ tipo: 'cnh' }} agir={agir} variante="discreto" ocultarImpossivel>{`Tirar ${hab.a} (${hab.escola})`}</BotaoAcao>}
      {segmento.id === 'veiculos' && i >= hab.comeca - 2 && !vida.trabalho.licencas.includes('cnh') && <p className="nota">{hab.frase}</p>}
      {segmento.id === 'veiculos' && leituraDaAutoescola(vida) && (
        <div className="autoescola">
          <p className="nota">{leituraDaAutoescola(vida)}</p>
          <div className="grupo-acoes grupo-acoes--linha">
            <BotaoAcao vida={vida} acao={{ tipo: 'cnh_prova' }} agir={agir} variante="secundario" ocultarBloqueado ocultarImpossivel>Fazer a prova teórica</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'cnh_preparar', como: 'teoria' }} agir={agir} variante="discreto" ocultarImpossivel>Estudar o manual e fazer simulados</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'cnh_preparar', como: 'pratica' }} agir={agir} variante="discreto" ocultarImpossivel>Fazer aulas extras de direção</BotaoAcao>
          </div>
        </div>
      )}
    </section>
  );
}

