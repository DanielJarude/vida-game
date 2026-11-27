/** VIDA 38 · bloco 3 — o dia a dia: passeios, torcida e bico (na aba de atividades); cartas e presentes (na aba de gente). */
import type { Acao } from '../../motor/acoes';
import { BotaoAcao } from '../comum';
import type { Vida } from '../../motor/tipos';
import { idade } from '../../motor/nucleo';

type Props = { vida: Vida; agir: (a: Acao) => boolean };
const P = (op: Extract<Acao, { tipo: 'personalizar' }>['op']): Acao => ({ tipo: 'personalizar', op });

export function PasseiosETorcida({ vida, agir }: Props) {
  const emTorcida = !!vida.fatos['torcida:ativa'];
  return (
    <section className="cotidiano38" aria-labelledby="titulo-passeios38">
      <h2 id="titulo-passeios38" className="secao-fio">Passeios e dia a dia</h2>
      <p className="nota">Passeios valem uma vez por ano cada um. Sem custo, mas com efeito no corpo e na cabeça.</p>
      <div className="grupo-acoes grupo-acoes--linha">
        <BotaoAcao vida={vida} agir={agir} acao={P({ o: 'passear', local: 'praia' })} variante="secundario">Ir à praia</BotaoAcao>
        <BotaoAcao vida={vida} agir={agir} acao={P({ o: 'passear', local: 'parque' })} variante="secundario">Ir ao parque</BotaoAcao>
        <BotaoAcao vida={vida} agir={agir} acao={P({ o: 'passear', local: 'pesca' })} variante="secundario">Pescar</BotaoAcao>
        <BotaoAcao vida={vida} agir={agir} acao={P({ o: 'passear', local: 'caminhada' })} variante="secundario">Fazer uma caminhada</BotaoAcao>
        {idade(vida) >= 14 && <BotaoAcao vida={vida} agir={agir} acao={P({ o: 'bico' })} variante="secundario">Fazer um serviço para vizinhos</BotaoAcao>}
      </div>
      {idade(vida) >= 14 && (
        <div className="grupo-acoes grupo-acoes--linha">
          {!emTorcida && <BotaoAcao vida={vida} agir={agir} acao={P({ o: 'torcida', acao: 'entrar' })} variante="secundario">Entrar na torcida organizada</BotaoAcao>}
          {emTorcida && <BotaoAcao vida={vida} agir={agir} acao={P({ o: 'torcida', acao: 'jogo' })} variante="secundario">Ir ao jogo com a torcida</BotaoAcao>}
          {emTorcida && <BotaoAcao vida={vida} agir={agir} acao={P({ o: 'torcida', acao: 'sair' })} variante="secundario">Sair da torcida</BotaoAcao>}
        </div>
      )}
    </section>
  );
}

export function CartasEPresentes({ vida, agir }: Props) {
  const pessoas = Object.keys(vida.vinculos).filter(id => vida.pessoas[id] && !vida.vinculos[id].convivio?.includes('casa')).slice(0, 8);
  if (!pessoas.length) return null;
  return (
    <section className="cotidiano38" aria-labelledby="titulo-cartas38">
      <h2 id="titulo-cartas38" className="secao-fio">Cartas e presentes</h2>
      <p className="nota">Para quem está longe. Uma carta por ano para cada pessoa; o presente custa e aproxima mais.</p>
      <ul className="cotidiano38__lista">
        {pessoas.map(id => (
          <li key={id} className="grupo-acoes grupo-acoes--linha">
            <span>{vida.pessoas[id].nome}</span>
            <BotaoAcao vida={vida} agir={agir} acao={P({ o: 'carta', pessoaId: id })} variante="secundario">Escrever</BotaoAcao>
            <BotaoAcao vida={vida} agir={agir} acao={P({ o: 'presente', pessoaId: id })} variante="secundario">Mandar um presente</BotaoAcao>
          </li>
        ))}
      </ul>
    </section>
  );
}
