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
import { DECORACAO35, type Instalacoes34, type SalaPersonalizada35 } from '../../../motor/v33/dono/instalacoes34';
import { titularesDoJogo31, type OqueOrg31, type OrgEsports31 } from '../../../motor/v31/esports/org31';
import { JOGOS25 } from '../../../motor/v25/esports/jogos25';
import { CenaDoComodo, type ObjetoNaCena } from '../../ilustracao/comodos';
import { BotaoAcao } from '../../comum';
import { coresDaOrg34 } from '../../v31/esports/coresOrgs34';
import './casa35.css';

type Agir = (a: Acao) => boolean;
const A = (oque: OqueOrg31): Acao => ({ tipo: 'org31', oque } as Acao);
const SIGLA: Record<string, string> = { cs: 'CS', r6: 'R6', fortnite: 'Fortnite', valorant: 'VALORANT', lol: 'LoL', rocket: 'Rocket League' };

interface Sala35 { id: string; nome: string; tipo: string; area: number; base: string[]; padrao: Required<Omit<SalaPersonalizada35, 'extras'>>; sobre: string }

/** Os cômodos que a casa tem agora, com os móveis que cada um tem por natureza. */
export function salasDaCasa35(o: OrgEsports31, ano: number): Sala35[] {
  const casa = o.casa35 ?? [];
  const estilo = o.instalacoes34?.estilo ?? 'loft';
  const out: Sala35[] = [];
  for (const L of o.linhas) {
    const n = Math.min(5, titularesDoJogo31(L.jogo, ano));
    const s = L.setup35;
    const cadeira = (s?.cadeira ?? 0) >= 2 ? 'cadeira_ergonomica' : 'cadeira';
    out.push({
      id: `treino_${L.jogo}`, nome: `Treino · ${SIGLA[L.jogo] ?? JOGOS25[L.jogo].nome(ano)}`, tipo: 'jogos', area: 24 + n * 4,
      base: [...Array(n)].flatMap(() => ['computador', cadeira]),
      padrao: { parede: 'preto_fosco', piso: 'carpete', luz: ano >= 2008 ? 'fita_led' : 'simples' },
      sobre: `A sala da line de ${JOGOS25[L.jogo].nome(ano)}: ${n} estações${s ? ` (${(s.monitor ?? 0) >= 2 ? 'monitores de alta taxa' : 'monitor simples'}, ${cadeira === 'cadeira' ? 'cadeira comum' : 'cadeira ergonômica'})` : ' (o equipamento se monta na aba Equipamento da line)'}.`
    });
  }
  if (o.conteudo >= 1 || casa.includes('estudio') || o.criadores35?.length) out.push({ id: 'estudio', nome: casa.includes('estudio') ? 'Estúdio profissional' : 'Estúdio', tipo: 'estudio', area: casa.includes('estudio') ? 22 : 14, base: ['microfone', 'computador', ...(casa.includes('estudio') ? ['sofa'] : [])], padrao: { parede: 'grafite', piso: 'vinilico', luz: ano >= 1985 ? 'trilho' : 'simples' }, sobre: 'Onde saem as lives, os vídeos e o conteúdo dos criadores.' });
  if (casa.includes('analise')) out.push({ id: 'analise', nome: 'Sala de análise', tipo: 'cinema', area: 22, base: ['projetor', 'poltronas_cinema'], padrao: { parede: 'azul_marinho', piso: 'carpete', luz: 'simples' }, sobre: 'O telão para rever as partidas com o técnico.' });
  if (casa.includes('academia')) out.push({ id: 'academia', nome: 'Academia', tipo: 'academia', area: 28, base: ['esteira', 'estacao_musculacao', 'bicicleta_ergometrica'], padrao: { parede: 'cinza_claro', piso: 'cimento', luz: ano >= 2008 ? 'plafon' : 'simples' }, sobre: 'Corpo em dia para a maratona de treino.' });
  if (casa.includes('fisio')) out.push({ id: 'fisio', nome: 'Fisioterapia', tipo: 'academia', area: 14, base: ['cama_solteiro', 'bicicleta_ergometrica'], padrao: { parede: 'branco', piso: 'vinilico_cinza', luz: ano >= 2008 ? 'plafon' : 'simples' }, sobre: 'Punho, ombro e coluna cuidados.' });
  if (casa.includes('psicologo')) out.push({ id: 'psicologo', nome: 'Sala do psicólogo', tipo: 'escritorio', area: 12, base: ['poltrona', 'poltrona', 'plantas'], padrao: { parede: 'verde_salvia', piso: 'vinilico', luz: 'quente' }, sobre: 'Conversa sem câmera.' });
  out.push({ id: 'cozinha', nome: casa.includes('chef') ? 'Cozinha do chef' : 'Cozinha', tipo: 'cozinha', area: casa.includes('chef') ? 26 : 16, base: casa.includes('chef') ? ['geladeira_inox', 'fogao_profissional', 'mesa_jantar'] : ['geladeira', 'fogao', 'mesa_jantar'], padrao: { parede: 'azulejo_metro', piso: 'porcelanato', luz: 'simples' }, sobre: casa.includes('chef') ? 'O chef e a nutricionista cuidam do cardápio.' : 'Cada um cozinha o seu — ou pede.' });
  out.push({ id: 'quartos', nome: casa.includes('quartos') ? 'Quartos individuais' : 'Quarto coletivo', tipo: 'quarto', area: casa.includes('quartos') ? 12 : 18, base: casa.includes('quartos') ? ['cama_solteiro', 'armario', 'cadeira_ergonomica'] : ['beliche', 'beliche', 'armario'], padrao: { parede: 'off_white', piso: 'vinilico', luz: 'simples' }, sobre: casa.includes('quartos') ? 'Cada jogador com o seu canto (aqui, um deles).' : 'Beliches: todo mundo junto.' });
  out.push({ id: 'lounge', nome: 'Lounge', tipo: 'sala', area: 30, base: ['sofa', 'tv_oled', 'videogame'], padrao: { parede: 'tijolo', piso: 'cimento', luz: ano >= 2008 ? 'fita_led' : 'quente' }, sobre: 'Onde o time descansa entre um treino e outro.' });
  if (estilo === 'casa') out.push({ id: 'piscina', nome: 'Piscina', tipo: 'piscina', area: 60, base: [], padrao: { parede: 'branco', piso: 'porcelanato', luz: 'simples' }, sobre: 'O casarão tem área externa.' });
  return out;
}

export function CasaDaOrg35({ vida, agir, inst }: { vida: Vida; agir: Agir; inst?: Instalacoes34 }) {
  const o = vida.orgEsports31!;
  const ano = anoDe(vida.t);
  const salas = useMemo(() => salasDaCasa35(o, ano), [o, ano]);
  const [sel, setSel] = useState(salas[0].id);
  const [r, setR] = useState<Instalacoes34>(() => ({ ...(inst ?? {}) }));
  const sala = salas.find(x => x.id === sel) ?? salas[0];
  const cor1 = o.identidade33?.cor1 ?? coresDaOrg34(o.nome)[0];
  const pers = (s: Sala35): SalaPersonalizada35 => r.salas35?.[s.id] ?? {};
  const aspecto = (s: Sala35, a: 'parede' | 'piso' | 'luz') => pers(s)[a] ?? s.padrao[a];
  const parede = (s: Sala35) => { const id = aspecto(s, 'parede'); return id === 'time' ? { id: 'branco', cor: cor1.startsWith('#') ? cor1 : '#3f3f46' } : { id, cor: opcaoDeAcabamento('parede', id)?.cor }; };
  const objetos = (s: Sala35): ObjetoNaCena[] => [...s.base, ...(pers(s).extras ?? [])].map((c, k) => ({ id: `${s.id}_${k}_${c}`, coisaId: c, ...(c === 'sofa' || c.startsWith('cadeira') || c === 'poltrona' ? { cor: cor1.startsWith('#') ? cor1 : undefined } : {}) }));
  const cena = (s: Sala35, largura: number) => <CenaDoComodo ano={ano} tipo={s.tipo} parede={parede(s)} piso={{ id: aspecto(s, 'piso'), cor: opcaoDeAcabamento('piso', aspecto(s, 'piso'))?.cor }} luz={aspecto(s, 'luz')} objetos={objetos(s)} area={s.area} largura={largura} rotulo={`${s.nome} da gaming house`} />;
  const mudaSala = (p: Partial<SalaPersonalizada35>) => setR(x => ({ ...x, salas35: { ...(x.salas35 ?? {}), [sala.id]: { ...(x.salas35?.[sala.id] ?? {}), ...p } } }));
  const extras = pers(sala).extras ?? [];
  const mudou = JSON.stringify(r) !== JSON.stringify(inst ?? {});
  const opcoes = (a: 'parede' | 'piso' | 'luz') => ACABAMENTOS[a].opcoes.filter(x => acabamentoNoAno(x, ano));
  const nomeCasa = r.nomeCasa || o.identidade33?.casa || `Gaming house da ${o.nome}`;
  return (
    <section className="casa35" aria-label="A gaming house">
      <header className="casa35__cabeca">
        <div><h4>{nomeCasa}</h4><p className="nota">{salas.length} cômodos · {o.linhas.reduce((s2, l) => s2 + l.elenco.length, 0)} jogadores morando · estilo {r.estilo === 'casa' ? 'casarão' : r.estilo === 'escritorio' ? 'andar corporativo' : 'loft'}</p></div>
      </header>
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
          {sala.tipo !== 'piscina' && (
            <div className="casa35__deco" role="group" aria-label="Decoração">
              <span className="casa35__rot">Decoração</span>
              <div className="casa35__fichas">{DECORACAO35.filter(d => !sala.base.includes(d)).map(d => <button key={d} type="button" className="casa35__ficha" aria-pressed={extras.includes(d)} onClick={() => mudaSala({ extras: extras.includes(d) ? extras.filter(x => x !== d) : [...extras, d] })}>{coisa(d)?.nome ?? d}</button>)}</div>
            </div>
          )}
          <details className="casa35__geral">
            <summary>A casa toda</summary>
            <label className="casa35__campo">Nome <input value={r.nomeCasa ?? ''} maxLength={40} placeholder={nomeCasa} onChange={e => setR(x => ({ ...x, nomeCasa: e.target.value }))} /></label>
            <div className="casa35__fichas" role="group" aria-label="Estilo da casa">
              {(['loft', 'casa', 'escritorio'] as const).map(e => <button key={e} type="button" className="casa35__ficha" aria-pressed={(r.estilo ?? 'loft') === e} onClick={() => setR(x => ({ ...x, estilo: e }))}>{e === 'loft' ? 'Loft' : e === 'casa' ? 'Casarão (com piscina)' : 'Andar corporativo'}</button>)}
            </div>
          </details>
          <div className="casa35__salvar">
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'dono', sub: { op: 'instalacoes', instalacoes: r } })} variante={mudou ? 'principal' : 'secundario'}>{mudou ? 'Salvar a casa' : 'Casa salva'}</BotaoAcao>
            {mudou && <button type="button" className="botao botao--discreto" onClick={() => setR({ ...(inst ?? {}) })}>Desfazer</button>}
          </div>
          <p className="nota">Os acabamentos são os mesmos da reforma da casa; decorar não custa nada nem muda o time. Os cômodos com efeito no time se constroem abaixo — e aparecem aqui.</p>
        </div>
      </div>
    </section>
  );
}
