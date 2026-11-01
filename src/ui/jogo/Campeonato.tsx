/**
 * HOTFIX 11.5.1 — O CAMPEONATO POR DENTRO: a tabela da última temporada (pontos, jogos, vitórias, empates, derrotas,
 * gols, saldo — na ordem dos critérios de desempate, com o clube da vida em destaque e as zonas de vaga continental e
 * de queda), os campeões de cada ano (a liga, a copa nacional, a continental) e os prêmios individuais do mundo (quem
 * ganhou cada um, e onde a vida ficou na votação). Tudo é leitura do motor (`ligas`, `competicoes`, `premiosDoFutebol`).
 */
import type { Vida } from '../../motor/tipos';
import { regrasDeAcesso, tabelaDaUltimaTemporada, vagasContinentais } from '../../motor/sistemas/ligas';
import { CRITERIOS_DE_DESEMPATE, pontosDaLinha, saldoDaLinha, SEM_CATALOGO } from '../../motor/sistemas/tabelaDaLiga';
import { campeoesDoPais, nomeDaCompeticao, idDaCopa, idContinental, confederacaoDe } from '../../motor/sistemas/competicoes';
import { historicoDosPremios, nomeDoPremio, PREMIOS } from '../../motor/sistemas/premiosDoFutebol';
import { divisaoDoNivel } from '../../motor/dados/clubes';
import { nomeDoPais, existePais } from '../../motor/mundo/registro';

const limpo = (c?: string) => (c ? c.replace(SEM_CATALOGO, '') : '—');
const pais = (id: string) => (existePais(id) ? nomeDoPais(id) : id);

/** A tabela da divisão (a última temporada fechada que a vida viu nela). */
export function TabelaDoCampeonato({ vida, paisId, nivel, destaque }: { vida: Vida; paisId: string; nivel: number; destaque?: string }) {
  const tab = tabelaDaUltimaTemporada(vida, paisId, nivel);
  if (!tab) return null;
  const regras = regrasDeAcesso(paisId);
  const caem = regras.fechada ? 0 : regras.troca[nivel - 2] ?? 0;
  const sobem = regras.fechada || nivel >= 4 ? 0 : regras.troca[nivel - 1] ?? 0;
  const vagas = nivel === 4 ? vagasContinentais(paisId) : 0;
  const n = tab.linhas.length;
  const foraDoCatalogo = tab.linhas.some(l => l[0].startsWith(SEM_CATALOGO));
  return (
    <div className="palmares__grupo campeonato" data-tabela={`${paisId}:${nivel}:${tab.ano}`}>
      <h4>{divisaoDoNivel(nivel, paisId)} {tab.ano} · a tabela</h4>
      <div className="palmares__historico-rolagem">
        <table className="palmares__historico campeonato__tabela">
          <thead><tr><th scope="col" title="Posição">#</th><th scope="col">Clube</th><th scope="col" title="Pontos">P</th><th scope="col" title="Jogos">J</th><th scope="col" title="Vitórias">V</th><th scope="col" title="Empates">E</th><th scope="col" title="Derrotas">D</th><th scope="col" title="Gols marcados">GP</th><th scope="col" title="Gols sofridos">GC</th><th scope="col" title="Saldo de gols">SG</th></tr></thead>
          <tbody>
            {tab.linhas.map((l, i) => {
              const zona = i < Math.max(sobem, vagas) ? 'cima' : i >= n - caem ? 'queda' : undefined;
              const sg = saldoDaLinha(l);
              return (
                <tr key={l[0]} className={`${l[0] === destaque ? 'campeonato__seu' : ''}${zona ? ` campeonato__zona--${zona}` : ''}`.trim() || undefined} aria-current={l[0] === destaque ? 'true' : undefined}>
                  <td>{i + 1}</td>
                  <td className="campeonato__clube">{limpo(l[0])}{l[0].startsWith(SEM_CATALOGO) ? <sup aria-label="fora do catálogo">†</sup> : null}</td>
                  <td><strong>{pontosDaLinha(l)}</strong></td><td>{l[1]}</td><td>{l[2]}</td><td>{l[3]}</td><td>{l[4]}</td><td>{l[5]}</td><td>{l[6]}</td><td>{sg > 0 ? `+${sg}` : sg}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="nota campeonato__legenda">
        Desempate: {CRITERIOS_DE_DESEMPATE.join(', ')}.
        {vagas ? ` Os ${vagas} primeiros vão ${nomeDaCompeticao(idContinental(confederacaoDe(paisId))).startsWith('copa') ? 'à copa continental' : `à ${nomeDaCompeticao(idContinental(confederacaoDe(paisId)))}`}.` : ''}
        {sobem ? ` Sobem ${sobem}.` : ''}{caem ? ` Caem ${caem}.` : ''}{regras.fechada ? ' Liga fechada: ninguém cai.' : ''}
        {foraDoCatalogo ? ' † clube fora do catálogo do jogo (nome gerado).' : ''}
      </p>
    </div>
  );
}

/** Os campeões do país, ano a ano (as temporadas que a vida viu). */
export function CampeoesDoPais({ vida, paisId }: { vida: Vida; paisId: string }) {
  const xs = campeoesDoPais(vida, paisId).slice(0, 12);
  if (!xs.length) return null;
  return (
    <div className="palmares__grupo campeonato">
      <h4>Os campeões · {pais(paisId)}</h4>
      <div className="palmares__historico-rolagem">
        <table className="palmares__historico">
          <thead><tr><th scope="col">Ano</th><th scope="col">{divisaoDoNivel(4, paisId)}</th><th scope="col">{nomeDaCompeticao(idDaCopa(paisId)).replace(/^./, x => x.toUpperCase())}</th><th scope="col">{nomeDaCompeticao(idContinental(confederacaoDe(paisId))).replace(/^./, x => x.toUpperCase())}</th></tr></thead>
          <tbody>{xs.map(x => <tr key={x.ano}><td>{x.ano}</td><td>{limpo(x.liga)}</td><td>{limpo(x.copa)}</td><td>{limpo(x.cont)}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

/** Os prêmios individuais do mundo, ano a ano: o vencedor de cada um, e a colocação da vida quando entrou na votação. */
export function PremiosDoMundo({ vida }: { vida: Vida }) {
  const anos = historicoDosPremios(vida).slice(0, 10);
  if (!anos.length) return null;
  const fem = vida.caminhos.futebolMundo?.feminino;
  return (
    <div className="palmares__grupo campeonato">
      <h4>Os prêmios do futebol</h4>
      <div className="palmares__historico-rolagem">
        <table className="palmares__historico campeonato__premios">
          <thead><tr><th scope="col">Ano</th>{PREMIOS.map(p => <th key={p} scope="col">{nomeDoPremio(p, fem)}</th>)}</tr></thead>
          <tbody>
            {anos.map(a => (
              <tr key={a.ano}>
                <td>{a.ano}</td>
                {PREMIOS.map(p => {
                  const x = a.premios.find(y => y.premio === p);
                  if (!x) return <td key={p}>—</td>;
                  return (
                    <td key={p} className={x.vencedor.voce ? 'campeonato__seu' : undefined}>
                      <span className="campeonato__vencedor">{x.vencedor.voce ? 'Você' : x.vencedor.nome}</span>
                      <span className="campeonato__meta">{limpo(x.vencedor.clube)} · {pais(x.vencedor.nac)}{p === 'chuteira_de_ouro' ? ` · ${x.vencedor.gols} gols` : ''}</span>
                      {!x.vencedor.voce && x.voce ? <span className="campeonato__meta campeonato__voce">você: {x.voce}º</span> : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="nota campeonato__legenda">Bola de Ouro e The Best: a temporada inteira (nota, gols e assistências pela posição, títulos, o peso da liga), só na primeira divisão. Chuteira de Ouro: gols na liga × o peso dela (ligas europeias). {nomeDoPremio('golden_boy', fem)}: até 20 anos, numa primeira divisão europeia. Os outros nomes são jogadores do mundo do jogo (fictícios).</p>
    </div>
  );
}
