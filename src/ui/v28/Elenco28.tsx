/**
 * VIDA 28 · O ELENCO E O MERCADO na tela do atleta de clube: quem joga com você (a posição, a idade, o nível perto do
 * seu, o contrato), quem disputa a sua vaga, e o que a janela fez — quem chegou, quem saiu, para onde, por quanto. Só lê
 * `CarreiraEsportiva.elenco28` (o mercado anda no motor: `sistemas/elenco28`). Sem elenco ainda (antes da primeira
 * janela, ou modalidade sem clube), não mostra nada.
 */
import { Escudo30 } from '../v30/escudos/Escudo30';
import type { CarreiraEsportiva, Vida } from '../../motor/tipos';
import { anoDe } from '../../motor/tempo';
import { concorrenteNaPosicao, nomeDoPapel, REGRAS_DO_MERCADO } from '../../motor/sistemas/elenco28';
import { habilidade } from '../../motor/sistemas/frentes';
import { dinheiroCurto } from '../apresentar';
import './v28.css';
import { aoClube, doClube } from '../../motor/dados/clubes';

const PAPEL: Record<string, string> = {
  goleiro: 'goleiro', zagueiro: 'zagueiro', lateral: 'lateral', volante: 'volante', meia: 'meia', ponta: 'ponta', atacante: 'atacante',
  fixo: 'fixo', ala_esquerda: 'ala esquerda', ala_direita: 'ala direita', pivo: 'pivô', armador: 'armador', ala: 'ala',
  levantador: 'levantador', ponteiro: 'ponteiro', oposto: 'oposto', central: 'central', libero: 'líbero'
};

function comparado(nivel: number, eu: number): string {
  const d = nivel - eu;
  return d >= 6 ? 'bem acima de você' : d >= 2 ? 'um pouco acima' : d > -2 ? 'no seu nível' : d > -6 ? 'um pouco abaixo' : 'bem abaixo';
}

export function Elenco28({ vida, e }: { vida: Vida; e: CarreiraEsportiva }) {
  const el = e.elenco28;
  if (!el || el.clube !== e.clube || e.fase !== 'profissional' || !REGRAS_DO_MERCADO[e.modalidade]) return null;
  const eu = habilidade(vida, e.modalidade);
  const papel = el.papel ?? el.atletas[0]?.papel;
  const conc = papel ? concorrenteNaPosicao(vida, e, papel) : undefined;
  const regras = REGRAS_DO_MERCADO[e.modalidade]!;
  const ultimoBonus = [...(e.temporadas ?? [])].reverse().find(t => t.bonus);
  return (
    <section className="divisao__secao" aria-label="O elenco e o mercado" data-elenco28="">
      <h3 className="subtitulo elenco30__titulo"><Escudo30 nome={e.clube} tamanho={30} /> O elenco {doClube(e.clube)}</h3>
      {conc && <p className="nota"><strong>Na disputa pela sua vaga:</strong> {conc.nome}, {Math.floor((vida.t - conc.tNasc) / 12)} anos — {comparado(conc.nivel, eu)}.</p>}
      <div className="elenco28__tabela" role="region" aria-label="Quem joga com você" tabIndex={0}>
        <table>
          <thead><tr><th>Nome</th><th>Posição</th><th>Idade</th><th>Nível</th><th>Contrato</th></tr></thead>
          <tbody>
            {el.atletas.map(a => (
              <tr key={a.id} className={a.papel === papel ? 'elenco28__rival' : undefined}>
                <td>{a.nome}</td>
                <td>{PAPEL[a.papel] ?? a.papel}</td>
                <td>{Math.floor((vida.t - a.tNasc) / 12)}</td>
                <td>{comparado(a.nivel, eu)}</td>
                <td>{a.emprestadoAte && a.emprestadoAte > vida.t ? `emprestado ${a.emprestadoPara?.startsWith('um') ? 'a ' + a.emprestadoPara : aoClube(a.emprestadoPara ?? 'outro clube')}` : `até ${anoDe(a.contratoAte)}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {el.movimentos.length > 0 && (
        <>
          <h4>A janela de transferências</h4>
          <ul className="elenco28__janela" aria-label="Movimentações do elenco">
            {[...el.movimentos].reverse().slice(0, 8).map((m, k) => <li key={k}>{m.ano} · {m.texto}</li>)}
          </ul>
        </>
      )}
      <p className="nota">{regras.taxa ? 'No mercado desta modalidade, há taxa de transferência e multa: o clube vende quem se valoriza, empresta o jovem que não joga e libera quem não renova.' : 'Nesta modalidade, o contrato é por temporada: no fim dela, cada um renova ou sai livre — sem taxa de transferência.'} A disputa pela {nomeDoPapel(papel ?? '')} pesa na escolha do treinador.{ultimoBonus ? ` O último bônus por conquista foi de ${dinheiroCurto(ultimoBonus.bonus!)} (${ultimoBonus.ano}).` : ''}</p>
    </section>
  );
}
