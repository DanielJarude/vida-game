/**
 * VIDA 28 · o arquétipo emergente na ficha (o atleta, o jogador de e-sports, o piloto).
 * VIDA 29.2 · O TIPO DE JOGADOR, como um cartão: o nome e o quanto ele está firmado (em afirmação, firme, marcante), o que
 * ele é, o que faz você ser assim (os atributos que puxam o tipo), o que ele faz na temporada (o que ajuda e o que
 * atrapalha), os traços que aparecem às vezes, desde quando e as trocas ao longo da carreira. Sem tipo ainda, diz que está
 * em formação e o que está mais perto de virar um — nunca inventa rótulo.
 */
import { arquetipo, efeitosEmPalavras, firmezaDoTipo, nomeDoArquetipo, type PerfilGuardado } from '../../motor/sistemas/arquetipos';
import { NOME_ATRIBUTO } from '../../motor/v26/esporte/atributos26';
import { NOME_ATRIBUTO25 } from '../../motor/v25/esports/jogos25';
import { anoDe } from '../../motor/tempo';
import './perfil28.css';

const DO_PILOTO: Record<string, string> = {
  pilotagem: 'pilotagem', consistencia: 'consistência', adaptacao: 'adaptação aos circuitos', fisico: 'preparo físico', experiencia: 'experiência', pressao: 'cabeça sob pressão',
  classificacao: 'classificação', ultrapassagem: 'ultrapassagem', pneus: 'gestão de pneus', combustivel: 'gestão de combustível', leitura: 'leitura de corrida'
};
const nomeDoAtributo = (id: string) => ((NOME_ATRIBUTO as Record<string, string>)[id] ?? (NOME_ATRIBUTO25 as Record<string, string>)[id] ?? DO_PILOTO[id] ?? id.replace(/_/g, ' ')).toLowerCase();
const sigla = (nome: string) => nome.replace(/\(.*\)/, '').split(/\s+/).filter(p => p.length > 2 || /^[A-Z]/.test(p)).slice(0, 2).map(p => p[0]).join('').toUpperCase();

export function Perfil28({ perfil, genero }: { perfil?: PerfilGuardado; genero?: string }) {
  if (!perfil) return null;
  if (!perfil.principal) {
    const perto = perfil.perto ? arquetipo(perfil.perto.id) : undefined;
    return (
      <section className="tipo29 tipo29--vazio" aria-label="Tipo de jogador" data-perfil28="">
        <p className="tipo29__kicker">Tipo de jogador</p>
        <div className="tipo29__cabeca"><span className="tipo29__selo" aria-hidden>?</span><div><p className="tipo29__nome">Ainda em formação</p><p className="tipo29__sobre">Nenhum traço se destaca o bastante: o jeito de jogar se forma com as temporadas.</p></div></div>
        {perto && (
          <p className="tipo29__perto">Mais perto de virar <strong>{nomeDoArquetipo(perto.id, genero).toLowerCase()}</strong> — {perto.sobre.charAt(0).toLowerCase() + perto.sobre.slice(1)}
            {perto.atributos?.length ? <> Para chegar lá, conta: {perto.atributos.map(nomeDoAtributo).join(', ')}.</> : null}</p>
        )}
      </section>
    );
  }
  const a = arquetipo(perfil.principal);
  const nome = nomeDoArquetipo(perfil.principal, genero);
  const firmeza = firmezaDoTipo(perfil.forca);
  const efeitos = efeitosEmPalavras(perfil);
  const trocas = (perfil.historico ?? []).filter(h => h.principal);
  return (
    <section className={`tipo29 tipo29--${firmeza.replace(/\s.*/, '')}`} aria-label="Tipo de jogador" data-perfil28={perfil.principal}>
      <p className="tipo29__kicker">Tipo de jogador</p>
      <div className="tipo29__cabeca">
        <span className="tipo29__selo" aria-hidden>{sigla(nome)}</span>
        <div>
          <p className="tipo29__nome">{nome} <span className="tipo29__firmeza">{firmeza}</span></p>
          {a && <p className="tipo29__sobre">{a.sobre}</p>}
        </div>
      </div>
      {a?.atributos?.length ? (
        <div className="tipo29__linha"><span className="tipo29__rotulo">O que faz você ser assim</span><ul className="tipo29__chips">{a.atributos.map(id => <li key={id}>{nomeDoAtributo(id)}</li>)}</ul></div>
      ) : null}
      {efeitos.length > 0 && (
        <div className="tipo29__linha"><span className="tipo29__rotulo">Na temporada</span><ul className="tipo29__chips">{efeitos.map(e => <li key={e.texto} className={e.bom ? 'tipo29__chip--bom' : 'tipo29__chip--ruim'}>{e.texto}</li>)}</ul></div>
      )}
      {perfil.secundarios.length > 0 && (
        <div className="tipo29__linha"><span className="tipo29__rotulo">Às vezes, também</span><ul className="tipo29__chips">{perfil.secundarios.map(id => <li key={id} title={arquetipo(id)?.sobre}>{nomeDoArquetipo(id, genero).toLowerCase()}</li>)}</ul></div>
      )}
      <p className="tipo29__desde">Assim desde {anoDe(perfil.desde)}{trocas.length > 1 ? <> · {trocas.map(h => `${h.ano} ${nomeDoArquetipo(h.principal!, genero).toLowerCase()}`).join(' → ')}</> : null}</p>
    </section>
  );
}
