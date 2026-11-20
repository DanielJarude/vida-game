/**
 * VIDA 30 · §3 — O MEIO, na Fama: a privacidade que sobra, quem do meio você conhece (o vínculo de sempre), as figuras em
 * cena (ofício, cidade, tamanho do nome, os laços entre elas) e o que aconteceu com elas no ano — elas vivem sem você —,
 * e as vezes em que a fama aconteceu em pessoa.
 */
import type { Vida } from '../../../motor/tipos';
import { conhecidosDoMeio30, figura30, nomeDaFigura30, noticiasDoMeio30, type Figura30 } from '../../../motor/v30/fama/rede30';
import { municipio } from '../../../motor/dados/lugares';
import { anoDe } from '../../../motor/tempo';
import './meio30.css';

const NIVEL = ['', 'conhecid', 'famos', 'estrela'];
const LACO: Record<string, string> = { amizade: 'amizade com', rivalidade: 'rivalidade com', romance: 'namora', casados: 'casad', parceria: 'parceria com', separados: 'separou-se de' };
const nivelEm = (f: Figura30) => (f.nivel === 3 ? 'estrela' : `${NIVEL[f.nivel]}${f.genero === 'feminino' ? 'a' : 'o'}`);
const perto = (x: number) => (x >= 70 ? 'muito próximos' : x >= 50 ? 'amizade' : x >= 30 ? 'conhecidos' : 'pouco contato');

export default function Meio30({ vida }: { vida: Vida }) {
  const m = vida.fama30;
  if (!m) return null;
  const conhecidos = conhecidosDoMeio30(vida);
  const noticias = noticiasDoMeio30(vida, 1).slice(0, 6);
  const emCena = m.figuras.filter(f => f.fora === undefined).sort((a, b) => b.nivel - a.nivel).slice(0, 8);
  const vividas = [...m.vividas].reverse().slice(0, 4);
  return (
    <section className="fama13__bloco meio30" aria-labelledby="meio30-t">
      <h3 id="meio30-t" className="voce-subtitulo">O meio</h3>
      <div className="meio30__priv">
        <span>Privacidade</span>
        <span className="meio30__barra" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={m.privacidade} aria-label="Privacidade"><span style={{ width: `${Math.max(3, m.privacidade)}%` }} /></span>
        <strong>{m.privacidade >= 70 ? 'vida tranquila' : m.privacidade >= 40 ? 'olhada na rua' : m.privacidade >= 20 ? 'pouca' : 'quase nenhuma'}</strong>
      </div>
      {conhecidos.length > 0 && (
        <>
          <h4 className="meio30__h">Quem você conhece</h4>
          <ul className="meio30__lista">{conhecidos.map(({ f, vin }) => <li key={f.id}><strong>{nomeDaFigura30(f)}</strong><span>{f.oficio} · {perto(vin.proximidade)}{vin.romance && vin.romance.estagio !== 'ex' ? ' · romance' : ''}</span></li>)}</ul>
        </>
      )}
      {noticias.length > 0 && (
        <>
          <h4 className="meio30__h">No meio, este ano</h4>
          <ul className="meio30__lista">{noticias.map((n, k) => <li key={k} className={n.tom ? `meio30__${n.tom}` : undefined}><strong>{nomeDaFigura30(n.figura)}</strong><span>{n.texto}</span></li>)}</ul>
        </>
      )}
      <details className="meio30__det">
        <summary>Quem está em cena</summary>
        <ul className="meio30__lista">
          {emCena.map(f => {
            const l = f.lacos.filter(x => x.tipo !== 'amizade').slice(-1)[0];
            const o = l ? figura30(vida, l.com) : undefined;
            return <li key={f.id}><strong>{nomeDaFigura30(f)}</strong><span>{f.oficio} · {nivelEm(f)} · {municipio(f.municipioId).nome}{o && l ? ` · ${l.tipo === 'casados' ? `casad${f.genero === 'feminino' ? 'a' : 'o'} com` : LACO[l.tipo]} ${o.nome}` : ''}</span></li>;
          })}
        </ul>
      </details>
      {vividas.length > 0 && <p className="nota meio30__vividas">Em pessoa: {vividas.map(x => `${x.onde} (${anoDe(x.t)})`).join(' · ')}.</p>}
    </section>
  );
}
