/**
 * VIDA 33 · O EDITOR DA IDENTIDADE — a forma do escudo, o padrão, as três cores (paleta e seletor livre), o símbolo ou a
 * sigla, a estrela, o apelido da torcida e o nome da casa; o escudo e a camisa mudam na hora.
 */
import { FORMAS33, PADROES33, PALETA33, SIMBOLOS33, siglaDoNome33, type Identidade33 } from '../../../motor/v33/dono/identidade33';
import { desenhoDoClube30, Escudo30 } from '../../v30/escudos/Escudo30';

export function SeletorDeCor33({ rotulo, valor, mudar }: { rotulo: string; valor: string; mudar: (c: string) => void }) {
  return (
    <fieldset className="dono33__campo dono33__cor"><legend>{rotulo}</legend>
      <div className="dono33__paleta" role="group" aria-label={rotulo}>
        {PALETA33.map(c => <button key={c} type="button" className="dono33__amostra" style={{ background: c }} aria-pressed={valor.toLowerCase() === c} aria-label={c} title={c} onClick={() => mudar(c)} />)}
        <label className="dono33__livre" title="Outra cor"><input type="color" value={valor} onChange={e => mudar(e.target.value)} aria-label={`${rotulo}: outra cor`} /></label>
      </div>
    </fieldset>
  );
}

/** A identidade de partida: as cores e a forma que o nome sorteia (o mesmo escudo de sempre), hexágono no e-sports. */
export function identidadeInicial33(nome: string, esports: boolean): Identidade33 {
  const [forma, padrao, a, b, estrela] = desenhoDoClube30(nome.trim() || 'Time novo');
  return { forma: esports ? 'hexagono' : forma, padrao, cor1: a, cor2: b, cor3: a === '#111111' ? '#ffffff' : '#111111', simbolo: 'sigla', ...(estrela ? { estrela } : {}) };
}

export function EditorIdentidade33({ nome, ident, mudar, tipo }: { nome: string; ident: Identidade33; mudar: (i: Identidade33) => void; tipo: 'futebol' | 'quadra' | 'esports' }) {
  const casa = tipo === 'futebol' ? 'Nome do estádio' : tipo === 'quadra' ? 'Nome do ginásio' : 'Nome da gaming house';
  return (
    <div className="dono33__identidade">
      <div className="dono33__previa-escudo"><Escudo30 nome={nome.trim() || 'Time novo'} identidade={ident} tamanho={96} />{ident.apelido && <span className="nota">"{ident.apelido}"</span>}</div>
      <div className="dono33__editor">
        <fieldset className="dono33__campo"><legend>Forma do escudo</legend>
          <div className="dono33__fichas">{FORMAS33.map(f => <button key={f.id} type="button" className="chip" aria-pressed={ident.forma === f.id} onClick={() => mudar({ ...ident, forma: f.id })}>{f.nome}</button>)}</div>
        </fieldset>
        <fieldset className="dono33__campo"><legend>Padrão</legend>
          <div className="dono33__fichas">{PADROES33.map(p => <button key={p.id} type="button" className="chip" aria-pressed={ident.padrao === p.id} onClick={() => mudar({ ...ident, padrao: p.id })}>{p.nome}</button>)}</div>
        </fieldset>
        <SeletorDeCor33 rotulo="Cor principal" valor={ident.cor1} mudar={c => mudar({ ...ident, cor1: c })} />
        <SeletorDeCor33 rotulo="Segunda cor" valor={ident.cor2} mudar={c => mudar({ ...ident, cor2: c })} />
        <SeletorDeCor33 rotulo="Cor dos detalhes (contorno, letras, símbolo)" valor={ident.cor3} mudar={c => mudar({ ...ident, cor3: c })} />
        <fieldset className="dono33__campo"><legend>No centro</legend>
          <div className="dono33__fichas">{SIMBOLOS33.map(s => <button key={s.id} type="button" className="chip" aria-pressed={ident.simbolo === s.id} onClick={() => mudar({ ...ident, simbolo: s.id })}>{s.nome}</button>)}</div>
        </fieldset>
        <div className="dono33__linha">
          <label className="dono33__texto">Sigla <input value={ident.sigla ?? ''} maxLength={4} placeholder={siglaDoNome33(nome || 'Time novo')} onChange={e => mudar({ ...ident, sigla: e.target.value.toUpperCase() })} /></label>
          <label className="dono33__check"><input type="checkbox" checked={!!ident.estrela} onChange={e => mudar({ ...ident, estrela: e.target.checked })} /> Estrela no alto</label>
        </div>
        <div className="dono33__linha">
          <label className="dono33__texto">Apelido da torcida <input value={ident.apelido ?? ''} maxLength={32} placeholder={tipo === 'esports' ? 'ex.: a Matilha' : 'ex.: o Leão da Serra'} onChange={e => mudar({ ...ident, apelido: e.target.value })} /></label>
          <label className="dono33__texto">{casa} <input value={ident.casa ?? ''} maxLength={40} placeholder={tipo === 'esports' ? 'ex.: Casa Aurora' : tipo === 'quadra' ? 'ex.: Ginásio da Vila' : 'ex.: Estádio do Ipê'} onChange={e => mudar({ ...ident, casa: e.target.value })} /></label>
        </div>
      </div>
    </div>
  );
}
