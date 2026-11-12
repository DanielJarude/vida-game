/**
 * HOTFIX 11.5.1 — O ESTÚDIO DE TATUAGEM (Você · Aparência). VIDA 12.5 — a lupa. VIDA 12.6 — O ESTÚDIO INTEIRO:
 *
 * - **Nova tatuagem**: escolher ONDE tocando no próprio corpo (o mapa: cada região é um botão, de frente e de costas) ou
 *   pela lista; o DESENHO pelo estilo (miniaturas de verdade); o tamanho; e ajustar a posição dentro da região, a
 *   rotação, a escala fina e o espelhamento; a cor (só preto, preto e cinza, colorida — com o tom da tinta ou a paleta)
 *   e a intensidade; o texto do lettering; e o significado (por quem, por quê). A lupa mostra o desenho já no lugar,
 *   com as vizinhas — o motor diz se cabe, se fica por cima de outra, quanto custa.
 * - **Projetos**: a manga, a meia manga, o peito, as costas e a perna fechados — vários desenhos, um por região, unidos
 *   por um fundo; o que já está lá entra no conjunto.
 * - **As suas**: cada tatuagem com a data, a idade, o lugar, o significado e o estado da tinta; retocar, cobrir com um
 *   desenho maior, tirar no laser; e o histórico (o que saiu e o que foi coberto continua lembrado).
 */
import { memo, useMemo, useState } from 'react';
import type { Tatuagem, Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { anoDe } from '../../motor/tempo';
import {
  corPadraoDe, DESENHOS, desenhoDeTatuagem, MODELOS_DE_COMPOSICAO, NOME_COMPOSICAO, NOME_COR, NOME_ESTILO, NOME_GRUPO, NOME_SIGNIFICADO, NOME_TAMANHO, PALETAS, REGIOES, REGIOES_SIMPLES,
  regioesDoDesenho, SIGNIFICADO_COM_PESSOA, TONS_DO_TRACO, COMPOSICAO_TEM_LADO, modeloDeComposicao, type CorDaTatuagem, type EstiloDeTatuagem, type GrupoDoCorpo, type Lado,
  type RegiaoDeTatuagem, type SignificadoDaTatuagem, type TamanhoDeTatuagem, type TipoDeComposicao
} from '../../motor/dados/tatuagens';
import { NOME_TEMA, temaDoDesenho, type TemaDeTatuagem } from '../../motor/dados/tatuagens129';
import { MIDIA_DA_OBRA, NOME_MIDIA, type MidiaDaObra } from '../../motor/dados/tatuagens13';
import {
  composicoesNaFigura, desgasteDaTinta, estadoDaTatuagem, fraseDoSignificado, historicoDeTatuagens, IDADE_PARA_TATUAR, nomeDaTatuagem, ondeEsta, precoDaRemocao, precoDoPedido,
  precoDoRetoque, previaDaComposicao, previaDoPedido, regiaoDe, tatuagensDe, tatuagensNaFigura, tamanhoDe, type PedidoDeTatuagem, type TatuagemParaFigura
} from '../../motor/sistemas/tatuagens';
import { tipoDeCorpo } from '../../motor/sistemas/silhueta';
import { itensDaPessoa } from '../../motor/sistemas/estilo';
import { Figura, focoDaParte, focoDaRegiao } from '../avatar/Figura';
import { DesenhoDaTatuagem, caixaNativa } from '../avatar/tatuagens';
import type { ComposicaoNaFigura } from '../avatar/tatuagensNaPele';
import { BotaoAcao, Escolha } from '../comum';
import { dinheiroCurto } from '../leituraMaterial';

/** A lupa: 0 = corpo inteiro (o mapa para escolher onde); 1 = a região com o entorno; 2 e 3 = mais perto. */
const NIVEIS = ['Corpo inteiro', 'Região', 'Perto', 'Bem perto'] as const;
const PERTO = [1, 1, 1.8, 2.8];
const ESTILOS = (Object.keys(NOME_ESTILO) as EstiloDeTatuagem[]);
const maiuscula = (t: string) => t.replace(/^./, c => c.toUpperCase());
/** VIDA 12.9: a busca ignora acento e maiúscula. */
const semAcento = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
/** VIDA 13: o texto em que a busca procura — o nome, a descrição, o estilo, o tema, a obra e o tipo de obra (game, livro...). */
const TEXTO_DA_BUSCA = new Map(DESENHOS.map(x => {
  const tema = temaDoDesenho(x), midia = x.referencia ? MIDIA_DA_OBRA[x.referencia] : undefined;
  return [x.id, semAcento(`${x.nome} ${x.descricao} ${NOME_ESTILO[x.estilo]} ${tema ? NOME_TEMA[tema] : ''} ${x.referencia ?? ''} ${midia ? NOME_MIDIA[midia] : ''}`)];
}));
/** VIDA 13: as obras da cultura pop, agrupadas por tipo (videogames, livros, séries, filmes, animações), com a contagem. */
export const OBRAS_POR_MIDIA: { midia: MidiaDaObra; nome: string; obras: { obra: string; n: number }[] }[] = (() => {
  const n = new Map<string, number>();
  for (const x of DESENHOS) if (x.referencia) n.set(x.referencia, (n.get(x.referencia) ?? 0) + 1);
  return (Object.keys(NOME_MIDIA) as MidiaDaObra[]).map(midia => ({
    midia, nome: NOME_MIDIA[midia],
    obras: [...n].filter(([o]) => (MIDIA_DA_OBRA[o] ?? 'filmes') === midia).map(([obra, k]) => ({ obra, n: k })).sort((a, b) => a.obra.localeCompare(b.obra, 'pt-BR'))
  })).filter(g => g.obras.length);
})();
/** O que o filtro do estúdio procura num desenho: o estilo, o tema, a obra (cultura pop) e a busca por palavra (todas as palavras). */
export function desenhosDoFiltro(f: { estilo?: EstiloDeTatuagem | ''; tema?: TemaDeTatuagem | ''; referencia?: string; busca?: string }) {
  const palavras = semAcento(f.busca?.trim() ?? '').split(/\s+/).filter(Boolean);
  return DESENHOS.filter(x => x.tamanho !== 4 && (!f.estilo || x.estilo === f.estilo) && (!f.tema || temaDoDesenho(x) === f.tema) && (!f.referencia || x.referencia === f.referencia)
    && palavras.every(q => TEXTO_DA_BUSCA.get(x.id)!.includes(q)));
}

type Parte = 'nova' | 'projetos' | 'minhas';

export function EstudioDeTatuagem({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const i = idade(vida);
  const minhas = tatuagensDe(vida);
  const [parte, setParte] = useState<Parte>('nova');
  const [cobrindo, setCobrindo] = useState<string | null>(null);
  if (i < 16 && !minhas.length) return null;
  const podeTatuar = i >= IDADE_PARA_TATUAR;
  const historico = historicoDeTatuagens(vida);
  return (
    <section className="estudio-tatuagem" aria-labelledby="estudio-titulo">
      <h3 id="estudio-titulo" className="voce-subtitulo">Tatuagens</h3>
      {!podeTatuar && <p className="nota">A partir dos {IDADE_PARA_TATUAR}: estúdio sério não tatua menor de idade.</p>}
      {podeTatuar && (
        <div className="estudio-tatuagem__partes" role="tablist" aria-label="Estúdio">
          {([['nova', cobrindo ? 'Cobertura' : 'Nova tatuagem'], ['projetos', 'Projetos'], ['minhas', `As suas (${minhas.length})`]] as [Parte, string][]).map(([id, r]) => (
            <button key={id} type="button" role="tab" aria-selected={parte === id} className={`estudio-tatuagem__parte${parte === id ? ' estudio-tatuagem__parte--ativa' : ''}`} onClick={() => setParte(id)}>{r}</button>
          ))}
        </div>
      )}
      {podeTatuar && parte === 'nova' && <NovaTatuagem vida={vida} agir={agir} cobrindo={cobrindo} aoCancelarCobertura={() => setCobrindo(null)} />}
      {podeTatuar && parte === 'projetos' && <Projetos vida={vida} agir={agir} />}
      {(parte === 'minhas' || !podeTatuar) && <AsSuas vida={vida} agir={agir} historico={historico} aoCobrir={id => { setCobrindo(id); setParte('nova'); }} podeTatuar={podeTatuar} />}
    </section>
  );
}

/* ------------------------------------------------------------------ nova tatuagem */

type Fig = { visual: Vida['eu']['visual']; genero: Vida['eu']['genero']; idade: number; semente: string; corpo: ReturnType<typeof tipoDeCorpo> };

function NovaTatuagem({ vida, agir, cobrindo, aoCancelarCobertura }: { vida: Vida; agir: (a: Acao) => boolean; cobrindo: string | null; aoCancelarCobertura: () => void }) {
  const i = idade(vida);
  const alvo = cobrindo ? tatuagensDe(vida).find(x => x.id === cobrindo) : undefined;
  const [regiaoLivre, setRegiao] = useState<RegiaoDeTatuagem>('antebraco');
  const [ladoLivre, setLado] = useState<Lado>('d');
  const regiao = alvo ? regiaoDe(alvo) : regiaoLivre;
  const ladoR: Lado | undefined = REGIOES[regiao].lados ? (alvo ? alvo.lado : ladoLivre) : undefined;
  const [estilo, setEstilo] = useState<EstiloDeTatuagem | ''>('');
  const [tema, setTema] = useState<TemaDeTatuagem | ''>('');
  const [referencia, setReferencia] = useState('');
  const [busca, setBusca] = useState('');
  const [desenho, setDesenho] = useState('andorinha');
  const d = desenhoDeTatuagem(desenho)!;
  const cabe = (t: TamanhoDeTatuagem) => regioesDoDesenho(d, t).includes(regiao);
  const tamanhosAqui = d.tamanhos.filter(cabe);
  const [tamanhoPedido, setTamanho] = useState<TamanhoDeTatuagem>(d.tamanho);
  const tamanho: TamanhoDeTatuagem = tamanhosAqui.includes(tamanhoPedido) ? tamanhoPedido : tamanhosAqui[tamanhosAqui.length - 1] ?? d.tamanho;
  const [aj, setAj] = useState({ x: 0, y: 0, escala: 1, rot: 0, espelhar: false });
  const [posLivre, setPosLivre] = useState(true);
  const [cor, setCor] = useState<CorDaTatuagem | ''>('');
  const corEf: CorDaTatuagem = cor && (cor !== 'colorida' || d.colorida) ? cor : corPadraoDe(d);
  const [tom, setTom] = useState('');
  const [intensidade, setIntensidade] = useState(1);
  const [texto, setTexto] = useState('');
  const [sig, setSig] = useState<SignificadoDaTatuagem>('estetica');
  const [pessoaId, setPessoaId] = useState('');
  const pessoas = useMemo(() => pessoasParaHomenagem(vida, sig), [vida, sig]);
  const pessoaValida = pessoas.some(p => p.id === pessoaId) ? pessoaId : '';
  const pedido: PedidoDeTatuagem = {
    desenho, regiao, ...(ladoR ? { lado: ladoR } : {}), tamanho,
    ajuste: { x: aj.x, y: aj.y, escala: aj.escala, rot: aj.rot, ...(aj.espelhar ? { espelhar: true } : {}) }, ...(posLivre && !alvo ? { posicaoLivre: true } : {}),
    cor: corEf, ...(tom ? { tom } : {}), ...(intensidade < 1 ? { intensidade } : {}),
    ...(d.texto ? { texto: texto.trim() || textoSugerido(vida, d.texto, pessoaValida) } : {}),
    ...(sig !== 'estetica' ? { significado: { tipo: sig, ...(pessoaValida ? { pessoaId: pessoaValida } : {}) } } : {}),
    ...(alvo ? { cobre: alvo.id } : {})
  };
  // Na posição automática, a prévia mostra onde o estúdio colocaria (o primeiro lugar livre).
  const previa = previaDoPedido(vida, pedido);
  const naPele = tatuagensNaFigura(vida).filter(t => t.id !== alvo?.id);
  const tatuagens = previa ? [...naPele, previa] : naPele;
  const acao: Acao = { tipo: 'tatuar', ...pedido };
  const preco = precoDoPedido(vida, pedido);
  const fig = useMemo<Fig>(() => ({ visual: vida.eu.visual, genero: vida.eu.genero, idade: i, semente: vida.eu.semente ?? 'eu', corpo: tipoDeCorpo(vida) }), [vida, i]);
  const desenhos = desenhosDoFiltro({ estilo, tema, referencia: !estilo || estilo === 'cultura_pop' ? referencia : '', busca });
  const pecas = desenhos.filter(x => x.tamanhos.some(t => regioesDoDesenho(x, t).includes(regiao)));
  const fora = desenhos.filter(x => !pecas.includes(x));
  // VIDA 13: só setters (a miniatura é memorizada e guarda a primeira versão desta função).
  const escolherDesenho = (id: string) => { setDesenho(id); const n = desenhoDeTatuagem(id)!; setTamanho(n.tamanho); setTexto(''); if (!n.colorida) setCor(c => (c === 'colorida' ? '' : c)); };
  const escolherRegiao = (r: RegiaoDeTatuagem, l?: Lado) => { if (alvo) return; setRegiao(r); if (l) setLado(l); setAj(a => ({ ...a, x: 0, y: 0 })); setPosLivre(true); };
  const grupos = (Object.keys(NOME_GRUPO) as GrupoDoCorpo[]);
  return (
    <div className="estudio-tatuagem__corpo">
      <Previa fig={fig} tatuagens={tatuagens} comps={composicoesNaFigura(vida)} regiao={regiao} lado={ladoR} aoEscolherRegiao={alvo ? undefined : escolherRegiao} vida={vida} />
      <div className="estudio-tatuagem__escolhas">
        {alvo && (
          <p className="estudio-tatuagem__aviso" role="status">
            Cobrindo a <strong>{nomeDaTatuagem(alvo).toLowerCase()}</strong> {ondeEsta(regiao, ladoR)}: o desenho novo precisa ser maior e mais escuro, e ficar por cima dela inteira.{' '}
            <button type="button" className="botao botao--discreto" onClick={aoCancelarCobertura}>Desistir da cobertura</button>
          </p>
        )}
        {!alvo && (
          <fieldset className="estudio-tatuagem__grupo">
            <legend>Onde</legend>
            <p className="nota">Toque no corpo (no corpo inteiro, de frente ou de costas) ou escolha aqui.</p>
            <label className="campo">
              <span className="campo__rotulo">Região</span>
              <select value={regiao} onChange={e => escolherRegiao(e.target.value as RegiaoDeTatuagem)}>
                {grupos.map(g => <optgroup key={g} label={NOME_GRUPO[g]}>{REGIOES_SIMPLES.filter(r => REGIOES[r].grupo === g).map(r => <option key={r} value={r}>{maiuscula(REGIOES[r].nome)}</option>)}</optgroup>)}
              </select>
            </label>
            {REGIOES[regiao].lados && <Escolha rotulo="Lado" valor={ladoLivre} aoMudar={l => { setLado(l); setAj(a => ({ ...a, x: 0, y: 0 })); }} opcoes={[{ id: 'd' as const, rotulo: 'Direito' }, { id: 'e' as const, rotulo: 'Esquerdo' }]} />}
          </fieldset>
        )}
        <fieldset className="estudio-tatuagem__grupo">
          <legend>Desenho</legend>
          <div className="estudio-tatuagem__estilos" role="radiogroup" aria-label="Estilo">
            {(['', ...ESTILOS.filter(e => e !== 'composicao')] as (EstiloDeTatuagem | '')[]).map(e => (
              <button key={e || 'todos'} type="button" role="radio" aria-checked={estilo === e} className={`estudio-tatuagem__chip${estilo === e ? ' estudio-tatuagem__chip--ativo' : ''}`} onClick={() => setEstilo(e)}>{e ? NOME_ESTILO[e] : 'Todos'}</button>
            ))}
          </div>
          {/* VIDA 12.9: o catálogo cresceu — o tema (bichos, natureza), a obra da cultura pop e a busca por nome. */}
          <div className="estudio-tatuagem__filtros">
            <label className="campo">
              <span className="campo__rotulo">Tema</span>
              <select value={tema} onChange={e => setTema(e.target.value as TemaDeTatuagem | '')}>
                <option value="">Todos os temas</option>
                {(Object.keys(NOME_TEMA) as TemaDeTatuagem[]).map(t => <option key={t} value={t}>{NOME_TEMA[t]}</option>)}
              </select>
            </label>
            {(!estilo || estilo === 'cultura_pop') && (
              <label className="campo">
                <span className="campo__rotulo">Obra</span>
                {/* VIDA 13: as obras agrupadas por tipo, com quantos desenhos cada uma tem. */}
                <select value={referencia} onChange={e => setReferencia(e.target.value)}>
                  <option value="">Todas as obras</option>
                  {OBRAS_POR_MIDIA.map(g => <optgroup key={g.midia} label={g.nome}>{g.obras.map(o => <option key={o.obra} value={o.obra}>{o.obra} ({o.n})</option>)}</optgroup>)}
                </select>
              </label>
            )}
            <label className="campo">
              <span className="campo__rotulo">Buscar</span>
              <input type="search" value={busca} placeholder="lobo, lua, anime, livro…" onChange={e => setBusca(e.target.value)} />
            </label>
          </div>
          <div className="estudio-tatuagem__catalogo" role="radiogroup" aria-label="Desenhos">
            {pecas.map(x => <Miniatura key={x.id} id={x.id} ativo={x.id === desenho} aoEscolher={() => escolherDesenho(x.id)} />)}
          </div>
          {desenhos.length === 0 && <p className="nota">Nenhum desenho com esse filtro.</p>}
          {desenhos.length > 0 && <p className="nota" aria-live="polite">{pecas.length} desenho{pecas.length > 1 ? 's' : ''} {pecas.length > 1 ? 'cabem' : 'cabe'} {ondeEsta(regiao, ladoR)}.</p>}
          {fora.length > 0 && <p className="nota">{fora.length} desenho{fora.length > 1 ? 's' : ''} desse filtro não cabe{fora.length > 1 ? 'm' : ''} {ondeEsta(regiao, ladoR)} ({fora.slice(0, 3).map(x => x.nome.toLowerCase()).join(', ')}{fora.length > 3 ? '…' : ''}).</p>}
          <p className="campo__nota"><strong>{d.nome}</strong> · {NOME_ESTILO[d.estilo]}{d.referencia ? ` (inspirado em ${d.referencia})` : ''}: {d.descricao}</p>
          {tamanhosAqui.length > 1 && <Escolha rotulo="Tamanho" valor={String(tamanho) as '1'} aoMudar={t => setTamanho(Number(t) as TamanhoDeTatuagem)} opcoes={tamanhosAqui.map(t => ({ id: String(t) as '1', rotulo: maiuscula(NOME_TAMANHO[t]) }))} />}
          {tamanhosAqui.length === 1 && <p className="nota">Tamanho: {NOME_TAMANHO[tamanho]}.</p>}
          {d.texto && (
            <label className="campo">
              <span className="campo__rotulo">{d.texto === 'nome' ? 'O nome' : d.texto === 'data' ? 'A data' : d.texto === 'iniciais' ? 'As iniciais' : d.texto === 'coordenadas' ? 'As coordenadas' : d.texto === 'numero' ? 'O número (DDD, ano, CEP)' : 'A frase'}</span>
              <input type="text" value={texto} maxLength={28} placeholder={textoSugerido(vida, d.texto, pessoaValida)} onChange={e => setTexto(e.target.value)} />
            </label>
          )}
        </fieldset>
        <fieldset className="estudio-tatuagem__grupo">
          <legend>Posição</legend>
          {!alvo && <label className="estudio-tatuagem__marca"><input type="checkbox" checked={posLivre} onChange={e => setPosLivre(e.target.checked)} /> O tatuador escolhe o lugar livre</label>}
          <div className="estudio-tatuagem__ajustes">
            {(!posLivre || alvo) && <>
              <Faixa rotulo="Para os lados" min={-1} max={1} passo={0.1} valor={aj.x} aoMudar={x => setAj(a => ({ ...a, x }))} leitura={aj.x === 0 ? 'no meio' : aj.x < 0 ? 'para dentro' : 'para fora'} />
              <Faixa rotulo="Para cima e para baixo" min={-1} max={1} passo={0.1} valor={aj.y} aoMudar={y => setAj(a => ({ ...a, y }))} leitura={aj.y === 0 ? 'no meio' : aj.y < 0 ? 'mais acima' : 'mais abaixo'} />
            </>}
            <Faixa rotulo="Escala" min={0.8} max={1.25} passo={0.05} valor={aj.escala} aoMudar={escala => setAj(a => ({ ...a, escala }))} leitura={`${Math.round(aj.escala * 100)}%`} />
            {!d.faixa && <Faixa rotulo="Rotação" min={-90} max={90} passo={5} valor={aj.rot} aoMudar={rot => setAj(a => ({ ...a, rot }))} leitura={`${aj.rot}°`} />}
            {!d.faixa && <label className="estudio-tatuagem__marca"><input type="checkbox" checked={aj.espelhar} onChange={e => setAj(a => ({ ...a, espelhar: e.target.checked }))} /> Espelhar o desenho</label>}
          </div>
          {/* VIDA 12.7: voltar ao que o tatuador propôs (no meio da região, tamanho natural, sem girar). */}
          {(aj.x !== 0 || aj.y !== 0 || aj.escala !== 1 || aj.rot !== 0 || aj.espelhar) && <button type="button" className="botao botao--discreto" onClick={() => setAj({ x: 0, y: 0, escala: 1, rot: 0, espelhar: false })}>Restaurar posição, tamanho e rotação</button>}
        </fieldset>
        <fieldset className="estudio-tatuagem__grupo">
          <legend>Cor</legend>
          <Escolha rotulo="Cor" valor={corEf} aoMudar={setCor} opcoes={(['preta', 'cinza', ...(d.colorida ? ['colorida' as const] : [])] as CorDaTatuagem[]).map(c => ({ id: c, rotulo: NOME_COR[c] }))} />
          <label className="campo">
            <span className="campo__rotulo">{corEf === 'colorida' ? 'Paleta' : 'Tom da tinta'}</span>
            <select value={tom} onChange={e => setTom(e.target.value)}>
              {(corEf === 'colorida' ? PALETAS : TONS_DO_TRACO).map(t => <option key={t.id} value={t.id === 'preto' || t.id === 'original' ? '' : t.id}>{t.nome}</option>)}
            </select>
          </label>
          <Faixa rotulo="Intensidade" min={0.6} max={1} passo={0.05} valor={intensidade} aoMudar={setIntensidade} leitura={intensidade >= 0.95 ? 'carregada' : intensidade >= 0.8 ? 'média' : 'suave'} />
        </fieldset>
        <fieldset className="estudio-tatuagem__grupo">
          <legend>Significado</legend>
          <label className="campo">
            <span className="campo__rotulo">Por quê</span>
            <select value={sig} onChange={e => setSig(e.target.value as SignificadoDaTatuagem)}>
              {(Object.keys(NOME_SIGNIFICADO) as SignificadoDaTatuagem[]).map(s => <option key={s} value={s}>{NOME_SIGNIFICADO[s]}</option>)}
            </select>
          </label>
          {SIGNIFICADO_COM_PESSOA.includes(sig) && (
            <label className="campo">
              <span className="campo__rotulo">Por quem</span>
              <select value={pessoaValida} onChange={e => setPessoaId(e.target.value)}>
                <option value="">Ninguém em especial</option>
                {pessoas.map(p => <option key={p.id} value={p.id}>{p.rotulo}</option>)}
              </select>
            </label>
          )}
        </fieldset>
        <BotaoAcao vida={vida} acao={acao} agir={a => { const ok = agir(a); if (ok && alvo) aoCancelarCobertura(); return ok; }} variante="principal">{`${alvo ? 'Cobrir' : 'Tatuar'} ${ondeEsta(regiao, ladoR)} (${dinheiroCurto(preco)})`}</BotaoAcao>
        <p className="nota">A prévia mostra o desenho no lugar, com as que já estão perto. Duas tatuagens não ficam uma por cima da outra; o que não cabe, o estúdio não faz.</p>
      </div>
    </div>
  );
}

function Faixa({ rotulo, min, max, passo, valor, aoMudar, leitura }: { rotulo: string; min: number; max: number; passo: number; valor: number; aoMudar: (n: number) => void; leitura: string }) {
  return (
    <label className="estudio-tatuagem__faixa">
      <span className="campo__rotulo">{rotulo} <span className="nota">· {leitura}</span></span>
      <input type="range" min={min} max={max} step={passo} value={valor} onChange={e => aoMudar(Number(e.target.value))} aria-valuetext={leitura} />
    </label>
  );
}

/** A miniatura do desenho (o desenho de verdade, em preto). */
/** VIDA 13: memorizada — o catálogo passou de 400 desenhos e não precisa redesenhar a cada ajuste de posição ou cor. */
const Miniatura = memo(function Miniatura({ id, ativo, aoEscolher }: { id: string; ativo: boolean; aoEscolher: () => void }) {
  const d = desenhoDeTatuagem(id)!;
  const [w, h] = caixaNativa(d);
  return (
    <button type="button" role="radio" aria-checked={ativo} className={`estudio-tatuagem__miniatura${ativo ? ' estudio-tatuagem__miniatura--ativa' : ''}`} onClick={aoEscolher} data-desenho={id} title={`${d.nome}${d.referencia ? ` (${d.referencia})` : ''} — ${d.descricao}`}>
      <svg viewBox={`-1 -1 ${w + 2} ${h + 2}`} width={44} height={44} aria-hidden="true" preserveAspectRatio="xMidYMid meet">
        <DesenhoDaTatuagem id={id} tinta="#1f2328" cor={c => c} traco={1.1} />
      </svg>
      <span>{d.nome}</span>
    </button>
  );
}, (a, b) => a.id === b.id && a.ativo === b.ativo);

/** Quem pode estar no significado: a família, os filhos, o amor, os amigos próximos — e quem já morreu. */
function pessoasParaHomenagem(v: Vida, sig: SignificadoDaTatuagem): { id: string; rotulo: string }[] {
  const out: { id: string; rotulo: string; peso: number }[] = [];
  for (const vin of Object.values(v.vinculos)) {
    const p = v.pessoas[vin.pessoaId];
    if (!p) continue;
    const fam = !!vin.parentesco, amor = !!vin.romance && vin.romance.estagio !== 'interesse';
    const amigo = vin.estagio === 'amigo' || vin.estagio === 'amigo_proximo';
    if (sig === 'filho' && vin.parentesco !== 'filho') continue;
    if (sig === 'amor' && !amor) continue;
    if (sig === 'familia' && !fam) continue;
    if (sig === 'homenagem' && !fam && !amigo && !amor) continue;
    const quem = vin.parentesco ? vin.parentesco.replace(/_/g, ' ') : amor ? (vin.romance!.estagio === 'ex' ? 'ex' : 'amor') : 'amizade';
    out.push({ id: p.id, rotulo: `${p.nome} (${quem}${p.vivo ? '' : ', em memória'})`, peso: (p.vivo ? 0 : 1) + (vin.proximidade ?? 0) / 100 });
  }
  return out.sort((a, b) => b.peso - a.peso).slice(0, 30);
}

function textoSugerido(v: Vida, tipo: NonNullable<ReturnType<typeof desenhoDeTatuagem>>['texto'], pessoaId: string): string {
  const p = pessoaId ? v.pessoas[pessoaId] : undefined;
  if (tipo === 'nome') return p?.nome ?? 'Maria';
  if (tipo === 'iniciais') return p ? `${p.nome[0]}·${p.sobrenome?.[0] ?? ''}`.replace(/·$/, '') : `${v.eu.nome[0]}·${v.eu.sobrenome[0]}`;
  if (tipo === 'data') return romanos(p ? anoDe(p.tNasc) : anoDe(v.t));
  if (tipo === 'coordenadas') return '23°33′S 46°38′O';
  // VIDA 17: o número — o ano (de nascimento de quem a tatuagem homenageia, ou o seu).
  if (tipo === 'numero') return String(anoDe(p ? p.tNasc : v.eu.tNasc));
  return 'Respira';
}
function romanos(n: number): string {
  const t: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let s = '';
  for (const [v, r] of t) while (n >= v) { s += r; n -= v; }
  return s;
}

/* ------------------------------------------------------------------ a prévia (a lupa) */

/**
 * A lupa grande (a região escolhida de perto, com as vizinhas) e as figuras de frente e de costas como referência. No
 * nível "Corpo inteiro", a figura grande é o MAPA: cada região é um botão.
 */
function Previa({ fig, tatuagens, comps, regiao, lado, aoEscolherRegiao, vida }: {
  fig: Fig; tatuagens: TatuagemParaFigura[]; comps: ComposicaoNaFigura[]; regiao: RegiaoDeTatuagem; lado: Lado | undefined;
  aoEscolherRegiao?: (r: RegiaoDeTatuagem, l?: Lado) => void; vida: Vida;
}) {
  const pecas = itensDaPessoa(vida).filter(x => x.usando);
  const R = REGIOES[regiao];
  const vistaPadrao: 'frente' | 'costas' = R.frente ? 'frente' : 'costas';
  const [nivel, setNivel] = useState(1);
  const [vistaEscolhida, setVista] = useState<'frente' | 'costas' | null>(null);
  const [vista0, setVista0] = useState(`${regiao}:${lado}`);
  if (vista0 !== `${regiao}:${lado}`) { setVista0(`${regiao}:${lado}`); setNivel(n => (n === 0 ? 0 : 1)); setVista(null); }
  const vista = vistaEscolhida ?? vistaPadrao;
  const foco = nivel === 0 ? focoDaParte(fig.genero, fig.corpo, fig.idade, 'inteiro', undefined, vista) : focoDaRegiao(fig.genero, fig.corpo, fig.idade, regiao, lado, vista, PERTO[nivel]);
  const visivel = vista === 'frente' ? R.frente : R.costas;
  const nome = ondeEsta(regiao, lado).replace(/^(no|na|nos|nas|por fora do) /, '');
  return (
    <div className="estudio-tatuagem__previa" aria-label="Prévia">
      <figure className="estudio-tatuagem__lupa" data-nivel={nivel} data-vista={vista} data-local={R.parte} data-regiao={regiao}>
        <Figura {...fig} pecas={pecas} semCima descalco vista={vista} tatuagens={tatuagens} composicoes={comps} largura={300} semFundo foco={foco}
          aoEscolherRegiao={nivel === 0 ? aoEscolherRegiao : undefined} regiaoEscolhida={{ regiao, lado }}
          rotulo={`${nivel === 0 ? 'Corpo inteiro' : `De perto: ${nome}`}, ${vista === 'frente' ? 'de frente' : 'de costas'}`} />
        <figcaption className="nota">{nivel === 0 ? (aoEscolherRegiao ? 'Corpo inteiro · toque onde quer a tatuagem' : 'Corpo inteiro') : maiuscula(nome)} · {vista === 'frente' ? 'de frente' : 'de costas'}{nivel > 0 && !visivel ? ' (não aparece deste lado)' : ''}</figcaption>
        <div className="estudio-tatuagem__lupa-controles" role="group" aria-label="Aproximar">
          <button type="button" className="botao botao--discreto" onClick={() => setNivel(Math.max(0, nivel - 1))} disabled={nivel === 0} aria-label="Afastar">−</button>
          <span className="estudio-tatuagem__nivel" aria-live="polite">{NIVEIS[nivel]}</span>
          <button type="button" className="botao botao--discreto" onClick={() => setNivel(Math.min(NIVEIS.length - 1, nivel + 1))} disabled={nivel === NIVEIS.length - 1} aria-label="Aproximar">+</button>
          {nivel !== 0 && <button type="button" className="botao botao--discreto" onClick={() => setNivel(0)}>Corpo inteiro</button>}
          {nivel === 0 && <button type="button" className="botao botao--discreto" onClick={() => setNivel(1)}>Ver a região</button>}
        </div>
      </figure>
      <div className="estudio-tatuagem__referencia" role="group" aria-label="Frente e costas">
        {(['frente', 'costas'] as const).map(v => (
          <button key={v} type="button" className={`estudio-tatuagem__lado${v === vista ? ' estudio-tatuagem__lado--ativo' : ''}`} aria-pressed={v === vista} onClick={() => setVista(v)}>
            <Figura {...fig} pecas={pecas} semCima descalco vista={v} tatuagens={tatuagens} composicoes={comps} largura={64} semFundo destaque={nivel > 0 && v === vista ? foco : undefined} rotulo={v === 'frente' ? 'De frente' : 'De costas'} />
            <span className="nota">{v === 'frente' ? 'De frente' : `De costas${!R.frente ? ' · onde ela fica' : ''}`}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ projetos */

function Projetos({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [modelo, setModelo] = useState(MODELOS_DE_COMPOSICAO[0].id);
  const [lado, setLado] = useState<Lado>('d');
  const m = modeloDeComposicao(modelo)!;
  const comLado = COMPOSICAO_TEM_LADO[m.tipo];
  const prev = previaDaComposicao(vida, modelo, comLado ? lado : undefined);
  const fig = useMemo<Fig>(() => ({ visual: vida.eu.visual, genero: vida.eu.genero, idade: idade(vida), semente: vida.eu.semente ?? 'eu', corpo: tipoDeCorpo(vida) }), [vida]);
  const pecas = itensDaPessoa(vida).filter(x => x.usando);
  const tipos = [...new Set(MODELOS_DE_COMPOSICAO.map(x => x.tipo))] as TipoDeComposicao[];
  const vista: 'frente' | 'costas' = m.tipo === 'costas' ? 'costas' : 'frente';
  const comps = [...composicoesNaFigura(vida), ...(prev ? [prev.composicao] : [])];
  return (
    <div className="estudio-tatuagem__corpo">
      <div className="estudio-tatuagem__previa">
        {(['frente', 'costas'] as const).map(v => (
          <figure key={v} className="estudio-tatuagem__projeto-figura">
            <Figura {...fig} pecas={pecas} semCima descalco vista={v} tatuagens={prev?.tatuagens ?? tatuagensNaFigura(vida)} composicoes={comps} largura={v === vista ? 200 : 110} semFundo rotulo={`${m.nome}, ${v === 'frente' ? 'de frente' : 'de costas'}`} />
            <figcaption className="nota">{v === 'frente' ? 'De frente' : 'De costas'}</figcaption>
          </figure>
        ))}
      </div>
      <div className="estudio-tatuagem__escolhas">
        <p className="nota">Um projeto junta vários desenhos (um por região) e, se quiser, um fundo que os liga. As que você já tem na parte entram no conjunto — nada é refeito; o estúdio só faz o que falta.</p>
        <label className="campo">
          <span className="campo__rotulo">Projeto</span>
          <select value={modelo} onChange={e => setModelo(e.target.value)}>
            {tipos.map(t => <optgroup key={t} label={NOME_COMPOSICAO[t]}>{MODELOS_DE_COMPOSICAO.filter(x => x.tipo === t).map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}</optgroup>)}
          </select>
          <span className="campo__nota">{m.descricao}</span>
        </label>
        {comLado && <Escolha rotulo="Lado" valor={lado} aoMudar={setLado} opcoes={[{ id: 'd' as const, rotulo: m.tipo === 'perna' ? 'Perna direita' : 'Braço direito' }, { id: 'e' as const, rotulo: m.tipo === 'perna' ? 'Perna esquerda' : 'Braço esquerdo' }]} />}
        {prev ? (
          <ul className="estudio-tatuagem__plano">
            {prev.plano.novas.map((n, k) => <li key={k}>Novo: <strong>{desenhoDeTatuagem(n.desenho)!.nome}</strong> {ondeEsta(n.regiao, n.lado)}</li>)}
            {prev.plano.existentes.map(x => <li key={x.id}>Já tem: {nomeDaTatuagem(x)} {ondeEsta(regiaoDe(x), x.lado)} (entra no conjunto)</li>)}
            {prev.plano.fundo !== 'nenhum' && <li>Fundo ligando tudo</li>}
          </ul>
        ) : <p className="nota">Não há lugar livre para esse projeto nessa parte do corpo.</p>}
        <BotaoAcao vida={vida} acao={{ tipo: 'compor_tatuagens', modelo, ...(comLado ? { lado } : {}) }} agir={agir} variante="principal">{`Fazer o projeto${prev ? ` (${dinheiroCurto(prev.plano.preco)})` : ''}`}</BotaoAcao>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ as suas */

function AsSuas({ vida, agir, historico, aoCobrir, podeTatuar }: { vida: Vida; agir: (a: Acao) => boolean; historico: Tatuagem[]; aoCobrir: (id: string) => void; podeTatuar: boolean }) {
  const naPele = historico.filter(x => estadoDaTatuagem(vida, x) !== 'removida' && estadoDaTatuagem(vida, x) !== 'coberta');
  const passado = historico.filter(x => !naPele.includes(x));
  if (!historico.length) return <p className="nota">Nenhuma tatuagem ainda.</p>;
  const nasc = vida.eu.tNasc;
  return (
    <div className="estudio-tatuagem__suas">
      <ul className="estudio-tatuagem__lista">
        {naPele.map(t => {
          const gasto = desgasteDaTinta(vida, t);
          const sig = fraseDoSignificado(vida, t.significado);
          const saindo = t.removida !== undefined;
          return (
            <li key={t.id} data-tatuagem={t.desenho} data-regiao={regiaoDe(t)}>
              <MiniaturaFixa id={t.desenho} />
              <span className="estudio-tatuagem__item">
                <strong>{nomeDaTatuagem(t)}</strong> {ondeEsta(regiaoDe(t), t.lado)}
                <span className="nota"> · {NOME_TAMANHO[tamanhoDe(t)]} · desde {anoDe(t.t)} ({Math.floor((t.t - nasc) / 12)} anos){sig ? ` · ${sig}` : ''}{t.retoques?.length ? ` · retocada ${t.retoques.length}×` : ''}{t.conjunto ? ' · parte de um projeto' : ''}{saindo ? ' · saindo no laser' : gasto >= 0.28 ? ' · a tinta pede retoque' : gasto >= 0.15 ? ' · a tinta já assentou' : ''}</span>
              </span>
              {!saindo && podeTatuar && <span className="estudio-tatuagem__acoes">
                <BotaoAcao vida={vida} acao={{ tipo: 'retocar_tatuagem', id: t.id }} agir={agir} variante="discreto" ocultarImpossivel>{`Retocar (${dinheiroCurto(precoDoRetoque(vida, t))})`}</BotaoAcao>
                {tamanhoDe(t) < 4 && <button type="button" className="botao botao--discreto" onClick={() => aoCobrir(t.id)}>Cobrir com outra</button>}
                <BotaoAcao vida={vida} acao={{ tipo: 'remover_tatuagem', id: t.id }} agir={agir} variante="discreto">{`Tirar no laser (${dinheiroCurto(precoDaRemocao(vida, t))})`}</BotaoAcao>
              </span>}
              <HistoriaDaTatuagem vida={vida} agir={agir} t={t} nasc={nasc} />
            </li>
          );
        })}
      </ul>
      {passado.length > 0 && (
        <details className="estudio-tatuagem__historico">
          <summary>O que já saiu da pele ({passado.length})</summary>
          <ul>
            {passado.map(t => <li key={t.id}>{nomeDaTatuagem(t)} {ondeEsta(regiaoDe(t), t.lado)} · feita em {anoDe(t.t)} · {t.coberta ? `coberta em ${anoDe(t.coberta.t)}` : `tirada no laser a partir de ${anoDe(t.removida!)}`}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}

/**
 * VIDA 12.7 — a história de uma tatuagem: quando foi feita (e com que idade), o porquê, cada retoque com a data, o que
 * mudou de significado, o laser. O significado pode mudar (a tinta, não).
 */
function HistoriaDaTatuagem({ vida, agir, t, nasc }: { vida: Vida; agir: (a: Acao) => boolean; t: Tatuagem; nasc: number }) {
  const [novo, setNovo] = useState<SignificadoDaTatuagem>(t.significado?.tipo ?? 'estetica');
  const idadeEm = (x: number) => Math.floor((x - nasc) / 12);
  const linhas: string[] = [`${anoDe(t.t)} · feita, aos ${idadeEm(t.t)} anos${t.significado ? ` — ${NOME_SIGNIFICADO[t.significado.tipo].toLowerCase()}${t.significado.nome ? ` (${t.significado.nome})` : ''}` : ''}${t.cobre ? ', cobrindo uma antiga' : ''}`];
  for (const r of t.retoques ?? []) linhas.push(`${anoDe(r)} · retocada, aos ${idadeEm(r)} anos`);
  for (const a of t.alteracoes ?? []) linhas.push(`${anoDe(a.t)} · o significado mudou${a.de ? `: de "${a.de.toLowerCase()}"` : ''} para "${a.para.toLowerCase()}"`);
  if (t.removida !== undefined) linhas.push(`${anoDe(t.removida)} · começou a sair no laser`);
  const ordenadas = linhas.sort();
  return (
    <details className="estudio-tatuagem__historia">
      <summary>História desta tatuagem ({ordenadas.length})</summary>
      <ol>{ordenadas.map((l, k) => <li key={k}>{l}</li>)}</ol>
      {t.removida === undefined && !t.coberta && (
        <div className="estudio-tatuagem__ressignificar">
          <label className="campo campo--compacto"><span className="campo__rotulo">O que ela significa hoje</span>
            <select value={novo} onChange={e => setNovo(e.target.value as SignificadoDaTatuagem)}>{(Object.keys(NOME_SIGNIFICADO) as SignificadoDaTatuagem[]).map(k => <option key={k} value={k}>{NOME_SIGNIFICADO[k]}</option>)}</select></label>
          <BotaoAcao vida={vida} acao={{ tipo: 'ressignificar_tatuagem', id: t.id, significado: { tipo: novo, ...(t.significado?.pessoaId && novo === t.significado.tipo ? { pessoaId: t.significado.pessoaId } : {}) } }} agir={agir} variante="discreto" ocultarImpossivel>Mudar o significado</BotaoAcao>
        </div>
      )}
    </details>
  );
}

function MiniaturaFixa({ id }: { id: string }) {
  const d = desenhoDeTatuagem(id);
  if (!d) return null;
  const [w, h] = caixaNativa(d);
  return <svg className="estudio-tatuagem__mini" viewBox={`-1 -1 ${w + 2} ${h + 2}`} width={36} height={36} aria-hidden="true"><DesenhoDaTatuagem id={id} tinta="currentColor" cor={c => c} /></svg>;
}
