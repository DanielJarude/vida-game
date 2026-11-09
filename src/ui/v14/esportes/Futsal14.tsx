/** VIDA 14 · na quadra: a posição no futsal (com o que cada uma faz) e o goleiro-linha. */
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { BotaoAcao } from '../../comum';
import { funcaoFutsalDe } from '../../../motor/sistemas/esporte';
import { FUNCOES_FUTSAL, NOME_FUNCAO_FUTSAL, SOBRE_FUNCAO_FUTSAL } from '../../../motor/v14/esportes/futsal14';
import '../politica/politica14.css';

export function Futsal14({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const e = vida.caminhos.esporte;
  if (!e || e.modalidade !== 'futsal') return null;
  const g = vida.eu.genero === 'feminino' ? 1 : 0;
  const fn = funcaoFutsalDe(vida, e);
  const F = (oque: unknown) => ({ tipo: 'futsal14', oque } as unknown as Acao);
  return (
    <section className="p14" aria-label="Na quadra">
      <div className="p14__bloco">
        <p className="p14__kicker">Na quadra · {NOME_FUNCAO_FUTSAL[fn][g]}{e.futsal?.goleiroLinha ? ' · goleiro-linha nos minutos finais' : ''}</p>
        <p className="nota">{SOBRE_FUNCAO_FUTSAL[fn]}</p>
        <div className="grupo-acoes">
          {FUNCOES_FUTSAL.filter(x => x !== fn).map(x => <BotaoAcao key={x} vida={vida} acao={F({ funcao: x })} agir={agir} variante="discreto" ocultarImpossivel>{`Jogar de ${NOME_FUNCAO_FUTSAL[x][g]}`}</BotaoAcao>)}
          <BotaoAcao vida={vida} acao={F({ goleiroLinha: !e.futsal?.goleiroLinha })} agir={agir} variante="discreto" ocultarImpossivel>{e.futsal?.goleiroLinha ? 'Deixar de ser o goleiro-linha' : 'Ser o goleiro-linha nos minutos finais'}</BotaoAcao>
        </div>
      </div>
    </section>
  );
}

export default Futsal14;
