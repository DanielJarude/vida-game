/**
 * REWORK 9.6 · UX-09/10 — as duas divisões de Caminhos que não são estudo nem emprego:
 *
 *   Vida pública      concursos (os editais, o preparo), a política (o partido, a candidatura, o mandato), as
 *                     carreiras de farda e de serviço público — e como cada uma começa
 *   Outros caminhos   o esporte (a base, as peneiras, a carreira de atleta e de técnico), a arte (o grupo, a banda,
 *                     o currículo artístico), a universidade como carreira — e as portas que a prática abriu
 *
 * Nada aqui é um sistema novo: são as mesmas leituras e ações de antes (`profissao.acoesDoTrabalho`, `concurso`,
 * `politica`, `caminhosDeVida`, `mercados.oportunidadesAbertas`), que antes ficavam espalhadas pelas partes do
 * Trabalho. Agora cada coisa tem um lugar só.
 */

import { useMemo } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { disponibilidade } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { acoesDasTrajetorias, acoesDoTrabalho, modoDoTrabalho, type AcaoProfissional } from '../../motor/sistemas/profissao';
import { leituraPolitica, naPolitica } from '../../motor/sistemas/politica';
import { emConstrucao } from '../../motor/sistemas/caminhosDeVida';
import { AcoesVivas } from '../comum';
import type { Aba } from '../navegacao';
import { EmConstrucao } from './Caminhos';
import { PortasAbertas } from './Estudos';
import { DesenvolvimentoReal } from './Progresso';
import { AMargem } from './Margem';
import { CarreiraComoTecnico, CarreiraNoEsporte, Concursos, CurriculoArtistico, Devolutivas, OutrosCaminhos, PainelBase, PainelPolitico, ehAcaoPublica } from './Trabalho';

/** Para onde vai cada passo de um caminho (as divisões novas no lugar das abas da procura de antes). */
function irDoPasso(irPara: (a: Aba) => void) {
  return (d: string) => irPara((d === 'explorar' ? 'vagas' : d === 'caminhos' ? 'outros_caminhos' : d) as Aba);
}

export function VidaPublica({ vida, agir, irPara }: { vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Aba) => void }) {
  const i = idade(vida);
  const ir = irDoPasso(irPara);
  const modo = modoDoTrabalho(vida);
  const pol = naPolitica(vida) || modo === 'politica' ? leituraPolitica(vida) : undefined;
  const acoes = useMemo(() => {
    const a = acoesDoTrabalho(vida, disponibilidade);
    return { agora: a.agora.filter(ehAcaoPublica), mais: a.mais.filter(ehAcaoPublica) };
  }, [vida]);
  const construindo = useMemo(() => emConstrucao(vida, disponibilidade).filter(c => c.id === 'concurso'), [vida]);
  const preso = !!vida.justica?.prisao;
  return (
    <div className="divisao divisao--publica">
      {pol && <PainelPolitico vida={vida} principal={modo === 'politica'} />}
      {(acoes.agora.length > 0 || acoes.mais.length > 0) && <AcoesVivas acoes={[...acoes.agora, ...acoes.mais] as AcaoProfissional[]} agir={agir} ir={ir} rotulo="O que dá para fazer na vida pública" />}
      <EmConstrucao vida={vida} lista={construindo} agir={agir} ir={ir} />
      {i >= 17 && !preso && (
        <section className="divisao__secao" aria-labelledby="titulo-editais">
          <h2 id="titulo-editais" className="secao-fio">Concursos</h2>
          <Concursos vida={vida} agir={agir} irPara={irPara} />
        </section>
      )}
      <Devolutivas vida={vida} tipos={['concurso']} />
      {i >= 16 && !preso && <OutrosCaminhos vida={vida} agir={agir} irPara={irPara} ir={ir} ids={['publico', 'forcas', 'seguranca', 'politica']} titulo="Carreiras públicas e política: como cada uma começa" />}
      {i < 16 && <p className="vazio">Concursos e política começam mais tarde: a maioria dos editais pede 18 anos; filiar-se a um partido, 16.</p>}
      {preso && <p className="vazio">Cumprindo pena, a vida pública espera: editais e candidaturas pedem a liberdade (e, muitas vezes, a ficha limpa).</p>}
    </div>
  );
}

export function OutrosCaminhosDaVida({ vida, agir, irPara }: { vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Aba) => void }) {
  const i = idade(vida);
  const ir = irDoPasso(irPara);
  const esp = vida.caminhos.esporte;
  const modo = modoDoTrabalho(vida);
  const construindo = useMemo(() => emConstrucao(vida, disponibilidade).filter(c => c.id === 'esporte' || c.id === 'arte' || c.id === 'academia'), [vida]);
  const grupo = useMemo(() => acoesDasTrajetorias(vida, disponibilidade).find(g => g.id === 'grupo'), [vida]);
  const arte = vida.caminhos.arte;
  return (
    <div className="divisao divisao--outros">
      {/* REWORK 10 · CRI-01: a vida à margem e a Justiça (só para quem tem o que ver nisso). */}
      <AMargem vida={vida} agir={agir} />
      <PortasAbertas vida={vida} agir={agir} filtro={o => ['peneira', 'seletiva', 'banda', 'grupo'].includes(o.tipo)} titulo="Portas do esporte e da arte" />
      {esp?.fase === 'base' && (
        <section className="divisao__secao paralelo" aria-label="A base">
          <h2 className="secao-fio">{esp.modalidade === 'futebol' ? 'A base' : 'A equipe'}</h2>
          <PainelBase vida={vida} />
        </section>
      )}
      {arte?.ativo && modo !== 'artista' && (
        <section className="divisao__secao paralelo" aria-label={arte.nome}>
          <h2 className="secao-fio">{arte.nome}</h2>
          <p className="nota">{arte.publico < 15 ? 'Quase ninguém conhece ainda.' : arte.publico < 40 ? 'Já tem quem vá ver.' : arte.publico < 65 ? 'Público fiel na cidade.' : 'Gente de fora já conhece.'}</p>
          {grupo && <AcoesVivas acoes={grupo.acoes} agir={agir} ir={ir} rotulo={`O que fazer com ${arte.nome}`} />}
        </section>
      )}
      <EmConstrucao vida={vida} lista={construindo} agir={agir} ir={ir} />
      {esp && <DesenvolvimentoReal vida={vida} lado="esporte" />}
      <Devolutivas vida={vida} tipos={['peneira', 'arte']} />
      {i >= 6 && <OutrosCaminhos vida={vida} agir={agir} irPara={irPara} ir={ir} ids={['esporte', 'arte', 'academia']} titulo="Esporte, arte, universidade: como cada um começa" />}
      <CarreiraNoEsporte vida={vida} aberta={modo === 'atleta'} />
      <CarreiraComoTecnico vida={vida} />
      <CurriculoArtistico vida={vida} agir={agir} />
      {i < 6 && <p className="vazio">Por enquanto, brincar. O esporte e a arte começam na semana — e viram caminho com o tempo.</p>}
    </div>
  );
}
