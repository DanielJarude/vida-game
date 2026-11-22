/**
 * VIDA 35.1 · A GAMING HOUSE COMO OS CÔMODOS DO JOGO. A casa da organização é mostrada com a mesma cena 2.5D da casa da
 * pessoa (`CenaDoComodo`: parede, piso, luz, móveis do catálogo na perspectiva): um cômodo por vez, escolhido nas
 * miniaturas. Cada line tem a sua sala de treino (um computador e uma cadeira por titular, do degrau do equipamento);
 * os outros cômodos aparecem quando existem (estúdio, análise, academia, fisioterapia, psicólogo, cozinha, quartos,
 * lounge; piscina e jardim no casarão). Personalizar é escolher os acabamentos da casa (os mesmos da reforma do lar) e a
 * decoração de cada cômodo — estético e gratuito; os cômodos com efeito no time se constroem logo abaixo.
 */
import { useMemo, useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { anoDe } from '../../../motor/tempo';
import { ACABAMENTOS, acabamentoNoAno, opcaoDeAcabamento } from '../../../motor/dados/lar';
import { coisa } from '../../../motor/dados/coisas';
import { DECORACAO_POR_TIPO35, NOMES34, opcoes34, type Instalacoes34, type SalaPersonalizada35 } from '../../../motor/v33/dono/instalacoes34';
import { titularesDoJogo31, type OqueOrg31, type OrgEsports31 } from '../../../motor/v31/esports/org31';
import { JOGOS25 } from '../../../motor/v25/esports/jogos25';
import { CenaDoComodo, type ObjetoNaCena } from '../../ilustracao/comodos';
import { BotaoAcao } from '../../comum';
import { coresDaOrg34 } from '../../v31/esports/coresOrgs34';
import { FachadaDaOrg35, type EstiloDaCasa35 } from './FachadaDaOrg35';
import './casa35.css';

type Agir = (a: Acao) => boolean;
const A = (oque: OqueOrg31): Acao => ({ tipo: 'org31', oque } as Acao);
const SIGLA: Record<string, string> = { cs: 'CS', r6: 'R6', fortnite: 'Fortnite', valorant: 'VALORANT', lol: 'LoL', rocket: 'Rocket League' };

interface Sala35 { id: string; nome: string; tipo: string; area: number; base: string[]; padrao: Required<Omit<SalaPersonalizada35, 'extras'>>; sobre: string; /** VIDA 35.2: a decoração que cabe neste tipo de cômodo. */ decoracao: readonly string[] }

/** Os cômodos que a casa tem agora, com os móveis que cada um tem por natureza. */
export function salasDaCasa35(o: OrgEsports31, ano: number): Sala35[] {
  const casa = o.casa35 ?? [];
  const estilo = o.instalacoes34?.estilo ?? 'loft';
  const out: Sala35[] = [];
  for (const L of o.linhas) {
    const n = Math.min(5, titularesDoJogo31(L.jogo, ano));
    const s = L.setup35;
    // VIDA 35.2: cada estação é uma mesa (o home studio, desenhado), o PC em cima dela e a cadeira ergonômica na frente.
    // Antes a base punha o PC sem mesa (ele "voava") e uma cadeira sem desenho (ela não aparecia).
    out.push({
      id: `treino_${L.jogo}`, nome: `Treino · ${SIGLA[L.jogo] ?? JOGOS25[L.jogo].nome(ano)}`, tipo: 'jogos', area: 22 + n * 6,
      base: [...Array(n)].flatMap(() => ['home_studio', 'computador', 'cadeira_ergonomica']),
      padrao: { parede: 'preto_fosco', piso: 'carpete', luz: ano >= 2008 ? 'fita_led' : 'simples' },
      sobre: `A sala da line de ${JOGOS25[L.jogo].nome(ano)}: ${n} ${n === 1 ? 'estação' : 'estações'} (mesa, PC e cadeira ergonômica de cada titular)${s ? `, ${(s.monitor ?? 0) >= 2 ? 'com monitores de alta taxa' : 'com monitor simples'}` : ' — o equipamento se monta na aba Equipamento da line'}.`,
      decoracao: DECORACAO_POR_TIPO35.jogos
    });
  }
  if (o.conteudo >= 1 || casa.includes('estudio') || o.criadores35?.length) out.push({ id: 'estudio', nome: casa.includes('estudio') ? 'Estúdio profissional' : 'Estúdio', tipo: 'estudio', area: casa.includes('estudio') ? 22 : 14, base: ['microfone', 'computador', ...(casa.includes('estudio') ? ['sofa'] : [])], padrao: { parede: 'grafite', piso: 'vinilico', luz: ano >= 1985 ? 'trilho' : 'simples' }, sobre: 'Onde saem as lives, os vídeos e o conteúdo dos criadores.', decoracao: DECORACAO_POR_TIPO35.estudio });
  if (casa.includes('analise')) out.push({ id: 'analise', nome: 'Sala de análise', tipo: 'cinema', area: 22, base: ['projetor', 'poltronas_cinema'], padrao: { parede: 'azul_marinho', piso: 'carpete', luz: 'simples' }, sobre: 'O telão para rever as partidas com o técnico.', decoracao: DECORACAO_POR_TIPO35.cinema });
  if (casa.includes('academia')) out.push({ id: 'academia', nome: 'Academia', tipo: 'academia', area: 28, base: ['esteira', 'estacao_musculacao', 'bicicleta_ergometrica'], padrao: { parede: 'cinza_claro', piso: 'cimento', luz: ano >= 2008 ? 'plafon' : 'simples' }, sobre: 'Corpo em dia para a maratona de treino.', decoracao: DECORACAO_POR_TIPO35.academia });
  if (casa.includes('fisio')) out.push({ id: 'fisio', nome: 'Fisioterapia', tipo: 'academia', area: 14, base: ['cama_solteiro', 'bicicleta_ergometrica'], padrao: { parede: 'branco', piso: 'vinilico_cinza', luz: ano >= 2008 ? 'plafon' : 'simples' }, sobre: 'Punho, ombro e coluna cuidados.', decoracao: DECORACAO_POR_TIPO35.academia });
  if (casa.includes('psicologo')) out.push({ id: 'psicologo', nome: 'Sala do psicólogo', tipo: 'escritorio', area: 12, base: ['poltrona', 'poltrona', 'plantas'], padrao: { parede: 'verde_salvia', piso: 'vinilico', luz: 'quente' }, sobre: 'Conversa sem câmera.', decoracao: DECORACAO_POR_TIPO35.escritorio });
  out.push({ id: 'cozinha', nome: casa.includes('chef') ? 'Cozinha do chef' : 'Cozinha', tipo: 'cozinha', area: casa.includes('chef') ? 26 : 16, base: casa.includes('chef') ? ['geladeira_inox', 'fogao_profissional', 'mesa_jantar'] : ['geladeira', 'fogao', 'mesa_jantar'], padrao: { parede: 'azulejo_metro', piso: 'porcelanato', luz: 'simples' }, sobre: casa.includes('chef') ? 'O chef e a nutricionista cuidam do cardápio.' : 'Cada um cozinha o seu — ou pede.', decoracao: DECORACAO_POR_TIPO35.cozinha });
  out.push({ id: 'quartos', nome: casa.includes('quartos') ? 'Quartos individuais' : 'Quarto coletivo', tipo: 'quarto', area: casa.includes('quartos') ? 12 : 18, base: casa.includes('quartos') ? ['cama_solteiro', 'armario', 'cadeira_ergonomica'] : ['beliche', 'beliche', 'armario'], padrao: { parede: 'off_white', piso: 'vinilico', luz: 'simples' }, sobre: casa.includes('quartos') ? 'Cada jogador com o seu canto (aqui, um deles).' : 'Beliches: todo mundo junto.', decoracao: DECORACAO_POR_TIPO35.quarto });
  out.push({ id: 'lounge', nome: 'Lounge', tipo: 'sala', area: 30, base: ['sofa', 'tv_oled', 'videogame'], padrao: { parede: 'tijolo', piso: 'cimento', luz: ano >= 2008 ? 'fita_led' : 'quente' }, sobre: 'Onde o time descansa entre um treino e outro.', decoracao: DECORACAO_POR_TIPO35.sala });
  if (estilo === 'casa') out.push({ id: 'piscina', nome: 'Piscina', tipo: 'piscina', area: 60, base: [], padrao: { parede: 'branco', piso: 'porcelanato', luz: 'simples' }, sobre: 'O casarão tem área externa.', decoracao: DECORACAO_POR_TIPO35.piscina });
  return out;
}

/** VIDA 35.2 · as luzes da casa por fora e por dentro (a cor da luz de noite e das janelas). */
const LUZES35 = [{ id: '#ffd9a0', nome: 'Quente' }, { id: '#fff3d6', nome: 'Neutra' }, { id: '#7fd4ff', nome: 'Azul' }, { id: '#b98bff', nome: 'Roxa' }, { id: '#7dff9e', nome: 'Verde' }];
/** VIDA 35.2 · o padrão de cada estilo de casa (o que a fachada mostra antes de a pessoa escolher). */
type Fora35 = { fachada: NonNullable<Instalacoes34['fachada']>; telhado: NonNullable<Instalacoes34['telhado']>; porta: NonNullable<Instalacoes34['porta']>; jardim: NonNullable<Instalacoes34['jardim']> };
const PADRAO_FORA35: Record<EstiloDaCasa35, Fora35> = {
  loft: { fachada: 'concreto', telhado: 'laje', porta: 'vidro', jardim: 'nenhum' },
  casa: { fachada: 'tijolo', telhado: 'telha', porta: 'madeira', jardim: 'grama' },
  escritorio: { fachada: 'vidro', telhado: 'laje', porta: 'vidro', jardim: 'pedras' }
};
const DESCRICAO_ESTILO35: Record<EstiloDaCasa35, string> = {
  loft: 'Um prédio de andares, com janelas grandes e varandas: a casa de bairro.',
  casa: 'Um sobrado com telhado, jardim e piscina nos fundos.',
  escritorio: 'Uma torre de vidro de muitos andares, com o saguão de entrada no térreo.'
};

/** Escolha de uma só entre opções (fichas), ou liga/desliga (uma ficha). */
function Fichas<T extends string>({ rotulo, opcoes, valor, onChange }: { rotulo: string; opcoes: { id: T; nome: string }[]; valor: T; onChange: (v: T) => void }) {
  return (
    <div className="casa35__deco" role="group" aria-label={rotulo}>
      <span className="casa35__rot">{rotulo}</span>
      <div className="casa35__fichas">{opcoes.map(x => <button key={x.id} type="button" className="casa35__ficha" aria-pressed={valor === x.id} onClick={() => onChange(x.id)}>{x.nome}</button>)}</div>
    </div>
  );
}
function Liga({ rotulo, ligado, onChange }: { rotulo: string; ligado: boolean; onChange: (v: boolean) => void }) {
  return <button type="button" className="casa35__ficha" aria-pressed={ligado} onClick={() => onChange(!ligado)}>{rotulo}</button>;
}

export function CasaDaOrg35({ vida, agir, inst }: { vida: Vida; agir: Agir; inst?: Instalacoes34 }) {
  const o = vida.orgEsports31!;
  const ano = anoDe(vida.t);
  const salas = useMemo(() => salasDaCasa35(o, ano), [o, ano]);
  const [sel, setSel] = useState(salas[0].id);
  const [aba, setAba] = useState<'fora' | 'dentro'>('dentro');
  const [r, setR] = useState<Instalacoes34>(() => ({ ...(inst ?? {}) }));
  const sala = salas.find(x => x.id === sel) ?? salas[0];
  const cor1 = o.identidade33?.cor1 ?? coresDaOrg34(o.nome)[0];
  const corTime = cor1.startsWith('#') ? cor1 : '#3f3f46';
  const pers = (s: Sala35): SalaPersonalizada35 => r.salas35?.[s.id] ?? {};
  const aspecto = (s: Sala35, a: 'parede' | 'piso' | 'luz') => pers(s)[a] ?? s.padrao[a];
  const parede = (s: Sala35) => { const id = aspecto(s, 'parede'); return id === 'time' ? { id: 'branco', cor: corTime } : { id, cor: opcaoDeAcabamento('parede', id)?.cor }; };
  const objetos = (s: Sala35): ObjetoNaCena[] => [...s.base, ...(pers(s).extras ?? [])].map((c, k) => ({ id: `${s.id}_${k}_${c}`, coisaId: c, ...(c === 'sofa' || c.startsWith('cadeira') || c === 'poltrona' ? { cor: corTime } : {}) }));
  const cena = (s: Sala35, largura: number) => <CenaDoComodo ano={ano} tipo={s.tipo} parede={parede(s)} piso={{ id: aspecto(s, 'piso'), cor: opcaoDeAcabamento('piso', aspecto(s, 'piso'))?.cor }} luz={aspecto(s, 'luz')} objetos={objetos(s)} area={s.area} largura={largura} rotulo={`${s.nome} da gaming house`} />;
  const mudaSala = (p: Partial<SalaPersonalizada35>) => setR(x => ({ ...x, salas35: { ...(x.salas35 ?? {}), [sala.id]: { ...(x.salas35?.[sala.id] ?? {}), ...p } } }));
  const extras = pers(sala).extras ?? [];
  const mudou = JSON.stringify(r) !== JSON.stringify(inst ?? {});
  const opcoes = (a: 'parede' | 'piso' | 'luz') => ACABAMENTOS[a].opcoes.filter(x => acabamentoNoAno(x, ano));
  const estilo: EstiloDaCasa35 = r.estilo === 'casa' ? 'casa' : r.estilo === 'escritorio' ? 'escritorio' : 'loft';
  const padrao = PADRAO_FORA35[estilo];
  const fora = {
    fachada: r.fachada ?? padrao.fachada, telhado: r.telhado ?? padrao.telhado, porta: r.porta ?? padrao.porta, jardim: r.jardim ?? padrao.jardim,
    varanda: r.varanda ?? false, plantas: r.plantas ?? false, neon: r.neon ?? false, luz: r.luz ?? LUZES35[0].id
  } as { fachada: NonNullable<Instalacoes34['fachada']>; telhado: NonNullable<Instalacoes34['telhado']>; porta: NonNullable<Instalacoes34['porta']>; jardim: NonNullable<Instalacoes34['jardim']>; varanda: boolean; plantas: boolean; neon: boolean; luz: string };
  const nomeCasa = r.nomeCasa || o.identidade33?.casa || `Gaming house da ${o.nome}`;
  return (
    <section className="casa35" aria-label="A gaming house">
      <header className="casa35__cabeca">
        <div><h4>{nomeCasa}</h4><p className="nota">{salas.length} cômodos · {o.linhas.reduce((s2, l) => s2 + l.elenco.length, 0)} jogadores morando · estilo {estilo === 'casa' ? 'casarão' : estilo === 'escritorio' ? 'andar corporativo' : 'loft'}</p></div>
        <div className="casa35__salvar">
          <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'dono', sub: { op: 'instalacoes', instalacoes: r } })} variante={mudou ? 'principal' : 'secundario'}>{mudou ? 'Salvar a casa' : 'Casa salva'}</BotaoAcao>
          {mudou && <button type="button" className="botao botao--discreto" onClick={() => setR({ ...(inst ?? {}) })}>Desfazer</button>}
        </div>
      </header>
      <div className="casa35__abas" role="group" aria-label="Por fora ou por dentro">
        <button type="button" className="casa35__ficha" aria-pressed={aba === 'fora'} onClick={() => setAba('fora')}>Por fora</button>
        <button type="button" className="casa35__ficha" aria-pressed={aba === 'dentro'} onClick={() => setAba('dentro')}>Por dentro</button>
      </div>
      {aba === 'fora' ? (
        <div className="casa35__palco">
          <figure className="casa35__cena casa35__fachada">
            <FachadaDaOrg35 estilo={estilo} nome={nomeCasa} fachada={fora.fachada} telhado={fora.telhado} porta={fora.porta} jardim={fora.jardim} varanda={fora.varanda} plantas={fora.plantas} neon={fora.neon} luz={fora.luz} corTime={corTime} piscina={estilo === 'casa'} largura={640} />
            <figcaption><strong>Por fora</strong> · {DESCRICAO_ESTILO35[estilo]}</figcaption>
          </figure>
          <div className="casa35__atelie">
            <Fichas rotulo="Material da fachada" opcoes={opcoes34Ids('fachada')} valor={fora.fachada} onChange={v => setR(x => ({ ...x, fachada: v as Instalacoes34['fachada'] }))} />
            <Fichas rotulo="Cobertura" opcoes={opcoes34Ids('telhado')} valor={fora.telhado} onChange={v => setR(x => ({ ...x, telhado: v as Instalacoes34['telhado'] }))} />
            <Fichas rotulo="Porta da entrada" opcoes={opcoes34Ids('porta')} valor={fora.porta} onChange={v => setR(x => ({ ...x, porta: v as Instalacoes34['porta'] }))} />
            <Fichas rotulo="Jardim e entrada" opcoes={opcoes34Ids('jardim')} valor={fora.jardim} onChange={v => setR(x => ({ ...x, jardim: v as Instalacoes34['jardim'] }))} />
            <div className="casa35__deco" role="group" aria-label="Luz e detalhes">
              <span className="casa35__rot">Luz de noite e detalhes</span>
              <div className="casa35__fichas">
                {LUZES35.map(l => <button key={l.id} type="button" className="casa35__ficha" aria-pressed={fora.luz === l.id} onClick={() => setR(x => ({ ...x, luz: l.id }))}>{l.nome}</button>)}
                <Liga rotulo="Varandas" ligado={fora.varanda} onChange={v => setR(x => ({ ...x, varanda: v }))} />
                <Liga rotulo="Plantas" ligado={fora.plantas} onChange={v => setR(x => ({ ...x, plantas: v }))} />
                <Liga rotulo="Letreiro em neon" ligado={fora.neon} onChange={v => setR(x => ({ ...x, neon: v }))} />
              </div>
            </div>
            <p className="nota">Por fora a casa é da organização: o nome do letreiro é o nome da casa (em “A casa toda”, abaixo). Estética e gratuita, como o resto.</p>
            <details className="casa35__geral">
              <summary>A casa toda</summary>
              <label className="casa35__campo">Nome <input value={r.nomeCasa ?? ''} maxLength={40} placeholder={nomeCasa} onChange={e => setR(x => ({ ...x, nomeCasa: e.target.value }))} /></label>
              <Fichas rotulo="Estilo da casa" opcoes={opcoes34Ids('estilo')} valor={estilo} onChange={v => setR(x => ({ ...x, estilo: v as Instalacoes34['estilo'] }))} />
              <p className="nota">Trocar o estilo muda a fachada e os cômodos (o casarão tem piscina; a torre não).</p>
            </details>
          </div>
        </div>
      ) : (
        <>
          <ul className="casa35__miniaturas" aria-label="Os cômodos">
            {salas.map(s => (
              <li key={s.id}><button type="button" className="casa35__mini" aria-pressed={s.id === sala.id} onClick={() => setSel(s.id)}>{cena(s, 150)}<span>{s.nome}</span></button></li>
            ))}
          </ul>
          <div className="casa35__palco">
            <figure className="casa35__cena">{cena(sala, 640)}<figcaption><strong>{sala.nome}</strong> · {sala.sobre}</figcaption></figure>
            <div className="casa35__atelie">
              <label className="casa35__campo">Parede
                <select value={aspecto(sala, 'parede')} onChange={e => mudaSala({ parede: e.target.value })}><option value="time">nas cores da organização</option>{opcoes('parede').map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}</select>
              </label>
              <label className="casa35__campo">Piso
                <select value={aspecto(sala, 'piso')} onChange={e => mudaSala({ piso: e.target.value })}>{opcoes('piso').map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}</select>
              </label>
              <label className="casa35__campo">Luz
                <select value={aspecto(sala, 'luz')} onChange={e => mudaSala({ luz: e.target.value })}>{opcoes('luz').map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}</select>
              </label>
              {sala.decoracao.length > 0 && (
                <div className="casa35__deco" role="group" aria-label="Decoração">
                  <span className="casa35__rot">Decoração deste cômodo</span>
                  <div className="casa35__fichas">{sala.decoracao.filter(d => !sala.base.includes(d)).map(d => <button key={d} type="button" className="casa35__ficha" aria-pressed={extras.includes(d)} onClick={() => mudaSala({ extras: extras.includes(d) ? extras.filter(x => x !== d) : [...extras, d] })}>{coisa(d)?.nome ?? d}</button>)}</div>
                </div>
              )}
              <p className="nota">{sala.sobre} Os acabamentos são os da reforma da casa; decorar não custa nada nem muda o time.</p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

/** As opções de um campo da casa (id e nome), na ordem da tela. */
function opcoes34Ids<T extends string>(k: 'fachada' | 'telhado' | 'porta' | 'jardim' | 'estilo'): { id: T; nome: string }[] {
  const ids = k === 'estilo' ? ['loft', 'casa', 'escritorio'] : opcoes34(k as never);
  return ids.map(id => ({ id: id as T, nome: k === 'estilo' ? (id === 'loft' ? 'Loft' : id === 'casa' ? 'Casarão (com piscina)' : 'Andar corporativo') : NOMES34[id] ?? id }));
}
