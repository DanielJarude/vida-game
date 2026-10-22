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
import { causasDoDesgaste } from '../../motor/sistemas/desgastePolitico';
import { emConstrucao } from '../../motor/sistemas/caminhosDeVida';
import { AcoesVivas } from '../comum';
import type { Aba } from '../navegacao';
import { EmConstrucao } from './Caminhos';
import { PortasAbertas } from './Estudos';
import { DesenvolvimentoReal } from './Progresso';
import { AMargem, temMargem } from './Margem';
import { BotaoAcao } from '../comum';
import { foragido } from '../../motor/sistemas/prisao';
import { CarreiraComoTecnico, CarreiraNoEsporte, Concursos, CurriculoArtistico, Devolutivas, OutrosCaminhos, PainelAtleta, PainelBase, PainelDaPena, PainelForagido, PainelPolitico, ehAcaoPublica } from './Trabalho';

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
      {/* REWORK 10.6 · C5: o desgaste com as causas e o caminho direto para as respostas (antes, só "Desgaste: bastante"). */}
      {pol && vida.caminhos.politica && vida.caminhos.politica.desgaste >= 15 && (() => {
        const causas = causasDoDesgaste(vida.caminhos.politica);
        return (
          <section className="divisao__secao desgaste-politico" aria-labelledby="titulo-desgaste" data-desgaste>
            <h2 id="titulo-desgaste" className="secao-fio">O desgaste: de onde vem e o que fazer</h2>
            {causas.length ? <ul className="desgaste-politico__causas">{causas.map(c => <li key={c.causa}><strong>{c.texto}</strong><span className="nota">{c.ajuda}</span></li>)}</ul> : <p className="nota">Um desgaste que já vinha de antes, sem causa registrada: esfria com o tempo.</p>}
            <p className="nota"><a className="link" href="#acoes-vida-publica">Ver as respostas possíveis ↓</a></p>
          </section>
        );
      })()}
      {(acoes.agora.length > 0 || acoes.mais.length > 0) && <div id="acoes-vida-publica"><AcoesVivas acoes={[...acoes.agora, ...acoes.mais] as AcaoProfissional[]} agir={agir} ir={ir} rotulo="O que dá para fazer na vida pública" /></div>}
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
  // REWORK 10.6 · C4: a carreira já começada vem primeiro, como "Em andamento" — nunca no meio das portas de quem começa.
  const emAndamento = esp?.fase === 'profissional' || (modo === 'artista' && !!vida.trabalho.atual);
  return (
    <div className="divisao divisao--outros">
      {emAndamento && (
        <section className="divisao__secao em-andamento" aria-labelledby="titulo-em-andamento" data-em-andamento>
          <h2 id="titulo-em-andamento" className="secao-fio">Em andamento</h2>
          {esp?.fase === 'profissional' ? <PainelAtleta vida={vida} /> : <p className="nota-grande">A sua carreira artística segue: os trabalhos, as propostas e o dinheiro estão em Trabalho · Meu trabalho; o currículo, logo abaixo.</p>}
          <p className="ligacao-caminho"><span>{esp?.fase === 'profissional' ? 'O contrato, os treinos extras e o dia a dia do clube estão em Trabalho · Meu trabalho.' : 'As propostas e as produções estão em Trabalho · Meu trabalho.'}</span> <button type="button" className="link" onClick={() => irPara('trabalho')}>Ir para Meu trabalho →</button></p>
        </section>
      )}
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

/**
 * REWORK 10.5 · CRI-02 — SUBMUNDO: a porta clara para o crime que o jogo já tem. Antes, a vida à margem era a primeira
 * seção de "Outros caminhos" (e só aparecia para quem já estava nela), a pena e a fuga ficavam no Trabalho e o
 * envolvimento, numa linha "Por fora". Aqui, na ordem de sempre: a situação, o que está em andamento (a pena, a fuga,
 * a trajetória, o processo), a porta (para quem não está nisso) e o histórico (a ficha).
 *
 * Nada aqui ensina coisa alguma: são as consequências, em palavras.
 */
export function Submundo({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Aba) => void }) {
  const i = idade(vida);
  const env = vida.caminhos.envolvimento;
  const dentro = !!env && env.parou === undefined;
  const preso = !!vida.justica?.prisao;
  return (
    <div className="divisao divisao--submundo">
      {preso && <PainelDaPena vida={vida} agir={agir} />}
      {foragido(vida) && <PainelForagido vida={vida} agir={agir} />}
      <AMargem vida={vida} agir={agir} />
      {!temMargem(vida) && !preso && (
        <section className="divisao__secao submundo__situacao" aria-labelledby="titulo-submundo-situacao">
          <h2 id="titulo-submundo-situacao" className="secao-fio">A situação</h2>
          <p>Nenhum envolvimento: a ficha está limpa e ninguém do meio sabe o seu nome.</p>
        </section>
      )}
      {!dentro && !preso && i >= 14 && (
        <section className="divisao__secao submundo__porta" aria-labelledby="titulo-submundo-porta">
          <h2 id="titulo-submundo-porta" className="secao-fio">A porta</h2>
          <p className="nota">O crime não tem vaga nem edital: a porta aparece pela vida — a turma, a necessidade, um contato antigo, o acesso a um dinheiro que não é seu — ou quando você a procura. A decisão é sempre sua.</p>
          <div className="grupo-acoes"><BotaoAcao vida={vida} acao={{ tipo: 'margem', oque: 'procurar_contato' }} agir={agir} variante="discreto">Procurar um contato</BotaoAcao></div>
          <ul className="submundo__pesa">
            <li>Dinheiro rápido, com teto — e só uma parte chega à conta.</li>
            <li>A exposição cresce a cada ano: investigação, processo, prisão, antecedentes.</li>
            <li>Quem está perto também paga: a família, o trabalho, os amigos.</li>
            <li>Sair é possível a qualquer momento — num grupo, custa pressão ou um acerto.</li>
          </ul>
        </section>
      )}
      {i < 14 && !temMargem(vida) && <p className="vazio">Nada disso faz parte da sua vida.</p>}
    </div>
  );
}
