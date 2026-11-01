/**
 * VIDA 12.5 — A RETROSPECTIVA DA VIDA (História · Retrospectiva): o álbum de memórias e a linha do tempo, lidos do que
 * o save registra (`motor/sistemas/albumDaVida`). Em cima, os momentos marcantes como fotos de álbum; depois, os
 * filtros por categoria e a linha do tempo por fase da vida, com a idade e o ano de cada memória. Carregada sob
 * demanda (fica fora do pacote do Jogo).
 */
import { useMemo, useState } from 'react';
import type { Vida } from '../../motor/tipos';
import { CATEGORIAS_DA_MEMORIA, memoriasDaVida, momentosMarcantes, quandoFoi, type CategoriaDaMemoria, type Memoria } from '../../motor/sistemas/albumDaVida';
import { idade } from '../../motor/nucleo';
import '../retrospectiva.css';

/** Os ícones por categoria (traço simples, 24 × 24, na cor da categoria). */
const ICONE: Record<CategoriaDaMemoria, string> = {
  familia: 'M4 11l8-6 8 6v8H4z M10 19v-5h4v5',
  relacionamentos: 'M12 19s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 7.6a3.8 3.8 0 0 1 7 2.2C19 14.6 12 19 12 19z',
  educacao: 'M3 9l9-4 9 4-9 4z M7 11v4c3 2 7 2 10 0v-4',
  carreira: 'M4 9h16v10H4z M9 9V6h6v3 M4 13h16',
  esportes: 'M8 4h8v4a4 4 0 0 1-8 0z M8 6H5a3 3 0 0 0 3 4 M16 6h3a3 3 0 0 1-3 4 M12 12v4 M8 20h8 M10 16h4',
  patrimonio: 'M3 12l9-7 9 7 M6 10v9h12v-9 M10 19v-4h4v4',
  viagens: 'M3 15l18-6-4 9-5-3-3 4v-5l9-5',
  conquistas: 'M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z',
  momentos: 'M12 4v3 M12 17v3 M4 12h3 M17 12h3 M6.3 6.3l2.1 2.1 M15.6 15.6l2.1 2.1 M6.3 17.7l2.1-2.1 M15.6 8.4l2.1-2.1 M12 9a3 3 0 1 1 0 6a3 3 0 0 1 0-6z'
};

export function IconeDaMemoria({ categoria, tamanho = 22 }: { categoria: CategoriaDaMemoria; tamanho?: number }) {
  return (
    <svg className="retro-icone" viewBox="0 0 24 24" width={tamanho} height={tamanho} aria-hidden="true" focusable="false">
      <path d={ICONE[categoria]} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const FASES: { ate: number; nome: string }[] = [
  { ate: 11, nome: 'Infância' }, { ate: 17, nome: 'Adolescência' }, { ate: 29, nome: 'Juventude' }, { ate: 59, nome: 'Vida adulta' }, { ate: 200, nome: 'Maturidade' }
];
const faseDe = (i: number) => FASES.find(f => i <= f.ate)!.nome;
const rotuloDa = (c: CategoriaDaMemoria) => CATEGORIAS_DA_MEMORIA.find(x => x.id === c)!.rotulo;

export function Retrospectiva({ vida, abrirPessoa }: { vida: Vida; abrirPessoa?: (id: string) => void }) {
  const memorias = useMemo(() => memoriasDaVida(vida), [vida]);
  const [filtro, setFiltro] = useState<CategoriaDaMemoria | 'todas'>('todas');
  const [soMarcantes, setSoMarcantes] = useState(false);
  const contagem = useMemo(() => {
    const c = {} as Record<CategoriaDaMemoria, number>;
    for (const m of memorias) c[m.categoria] = (c[m.categoria] ?? 0) + 1;
    return c;
  }, [memorias]);
  const marcantes = useMemo(() => momentosMarcantes(memorias), [memorias]);
  const visiveis = memorias.filter(m => (filtro === 'todas' || m.categoria === filtro) && (!soMarcantes || m.destaque === 2));
  const fases = FASES.map(f => ({ nome: f.nome, memorias: visiveis.filter(m => faseDe(m.idade) === f.nome) })).filter(f => f.memorias.length);
  const i = idade(vida);
  const fim = vida.morte ? ` · ${i} anos vividos` : ` · ${i} ${i === 1 ? 'ano' : 'anos'} até aqui`;
  const irParaFase = (nome: string) => document.getElementById(`retro-fase-${nome}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <section className="retro" aria-label="Retrospectiva da vida">
      <header className="retro__topo">
        <p className="retro__resumo">
          Nasceu em {Math.floor(vida.eu.tNasc / 12)}{fim} · {memorias.length} {memorias.length === 1 ? 'memória' : 'memórias'}
          {marcantes.length ? ` · ${marcantes.length} ${marcantes.length === 1 ? 'momento marcante' : 'momentos marcantes'}` : ''}
        </p>
      </header>

      {marcantes.length > 0 && (
        <section className="retro__marcantes" aria-label="Momentos marcantes">
          <h2 className="secao__titulo">Momentos marcantes</h2>
          <ol className="retro__fotos">
            {marcantes.slice(-12).map((m, k) => (
              <li key={m.id} className={`retro-foto retro--${m.categoria}`} style={{ ['--giro' as string]: `${(k % 3) - 1}deg` }}>
                <div className="retro-foto__imagem"><IconeDaMemoria categoria={m.categoria} tamanho={34} /></div>
                <p className="retro-foto__titulo">{m.titulo}</p>
                <p className="retro-foto__quando">{quandoFoi(m)}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="retro__filtros" role="group" aria-label="Categorias">
        <button type="button" className="retro-filtro" aria-pressed={filtro === 'todas'} onClick={() => setFiltro('todas')}>Toda a vida <span className="retro-filtro__n">{memorias.length}</span></button>
        {CATEGORIAS_DA_MEMORIA.map(c => (
          <button key={c.id} type="button" className={`retro-filtro retro--${c.id}`} aria-pressed={filtro === c.id} disabled={!contagem[c.id]} onClick={() => setFiltro(c.id)}>
            <IconeDaMemoria categoria={c.id} tamanho={16} />{c.rotulo} <span className="retro-filtro__n">{contagem[c.id] ?? 0}</span>
          </button>
        ))}
        <label className="retro__so">
          <input type="checkbox" checked={soMarcantes} onChange={e => setSoMarcantes(e.target.checked)} /> Só os marcantes
        </label>
      </div>

      {fases.length > 1 && (
        <nav className="retro__fases" aria-label="Fases da vida">
          {fases.map(f => <button key={f.nome} type="button" className="botao botao--discreto" onClick={() => irParaFase(f.nome)}>{f.nome}</button>)}
        </nav>
      )}

      {!visiveis.length && (
        <p className="nota retro__vazio">{memorias.length ? 'Nenhuma memória registrada nesta categoria — ainda.' : 'Esta vida ainda não tem memórias registradas.'}</p>
      )}

      {fases.map(f => (
        <section key={f.nome} id={`retro-fase-${f.nome}`} className="retro__fase" aria-label={f.nome}>
          <h2 className="retro__fase-titulo">{f.nome}</h2>
          <ol className="retro__linha">
            {f.memorias.map(m => <CartaoDaMemoria key={m.id} m={m} vida={vida} abrirPessoa={abrirPessoa} />)}
          </ol>
        </section>
      ))}
    </section>
  );
}

function CartaoDaMemoria({ m, vida, abrirPessoa }: { m: Memoria; vida: Vida; abrirPessoa?: (id: string) => void }) {
  const pessoa = m.pessoaId && vida.pessoas[m.pessoaId] && vida.vinculos[m.pessoaId] ? vida.pessoas[m.pessoaId] : undefined;
  return (
    <li className={`retro-memoria retro--${m.categoria}${m.destaque === 2 ? ' retro-memoria--marcante' : m.destaque === 1 ? ' retro-memoria--importante' : ''}`} data-tipo={m.tipo}>
      <span className="retro-memoria__marca" aria-hidden="true"><IconeDaMemoria categoria={m.categoria} tamanho={18} /></span>
      <div className="retro-memoria__corpo">
        <p className="retro-memoria__quando">{quandoFoi(m)} · <span className="retro-memoria__categoria">{rotuloDa(m.categoria)}</span></p>
        <h3 className="retro-memoria__titulo">{m.titulo}{m.destaque === 2 && <span className="retro-memoria__selo">marcante</span>}</h3>
        <p className="retro-memoria__texto">{m.texto}</p>
        {pessoa && abrirPessoa && <button type="button" className="botao botao--discreto retro-memoria__pessoa" onClick={() => abrirPessoa(pessoa.id)}>Ver {pessoa.nome}</button>}
      </div>
    </li>
  );
}
