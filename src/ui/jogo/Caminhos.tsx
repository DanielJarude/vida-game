/**
 * Componentes dos CAMINHOS (REWORK Caminhos, Agência e UX).
 *
 * A tela precisa responder, rápido: onde estou, o que posso fazer agora, o
 * que estou tentando, o que falta, estou melhorando, por que falhei, qual é
 * o próximo passo. Cada coisa tem um peso visual próprio e nunca depende só
 * da cor:
 *
 *   ESTADO      prosa em serifa (onde está, em palavras)
 *   REQUISITO   uma linha com marca de texto: ✓ cumprido · ◷ vem com o tempo (ano) · ○ falta
 *   PROGRESSO   uma linha que começa com a direção (↗ melhorou · → igual · ↘ caiu)
 *   AÇÃO        o botão do passo, com o porquê — sempre com cara de botão
 */

import type { ReactNode } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import type { ProximoPasso, Requisito } from '../../motor/sistemas/trabalho';
import type { CaminhoEmConstrucao, CaminhoPossivel, PassoDoCaminho } from '../../motor/sistemas/caminhosDeVida';
import type { PerfilVaga } from '../../motor/sistemas/empregabilidade';
import { BotaoAcao } from '../comum';
import './../caminhos.css';

const TIPO_REQUISITO: Record<Requisito['tipo'], string> = {
  idade: 'Idade', servico: 'Tempo de corporação', posto: 'Tempo no posto', experiencia: 'Estrada na área', formacao: 'Formação', registro: 'Registro',
  curso: 'Curso', fisico: 'Teste físico', desempenho: 'Desempenho', cidade: 'Cidade', vaga: 'Vaga'
};

function marca(r: Requisito): { glifo: string; estado: string } {
  if (r.ok) return { glifo: '✓', estado: 'cumprido' };
  if (r.tipo === 'vaga') return { glifo: '…', estado: 'depois' };
  if (r.ano !== undefined) return { glifo: '◷', estado: `em ${r.ano}` };
  return { glifo: '○', estado: 'falta' };
}

/** O próximo passo da carreira: destino, previsão e a lista do que falta — cada requisito com o tipo certo. */
export function ProximoPassoPainel({ passo }: { passo: ProximoPasso }) {
  return (
    <section className="proximo-passo" aria-label={`Próximo passo: ${passo.destino}`}>
      <p className="proximo-passo__rotulo">Próximo passo</p>
      <p className="proximo-passo__destino">{passo.destino}{passo.previsao ? <span className="proximo-passo__ano"> · por volta de {passo.previsao}</span> : null}</p>
      <p className="proximo-passo__resumo">{passo.resumo}</p>
      <ul className="requisitos">
        {passo.requisitos.map((r, k) => {
          const m = marca(r);
          return (
            <li key={k} className={`requisito requisito--${r.ok ? 'ok' : r.tipo === 'vaga' ? 'depois' : r.ano !== undefined ? 'tempo' : 'falta'}`}>
              <span className="requisito__glifo" aria-hidden>{m.glifo}</span>
              <span className="requisito__tipo">{TIPO_REQUISITO[r.tipo]}<span className="sr-only">: {m.estado}.</span></span>
              <span className="requisito__texto">{r.texto}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Direção do progresso, dita por glifo e palavra (nunca só cor). */
function Progresso({ texto }: { texto?: string }) {
  if (!texto) return null;
  const sobe = /subiu|evoluiu|melhorou|rendeu|mais forte|apareceu/.test(texto);
  const cai = /caiu|esfriou/.test(texto);
  return <p className={`progresso progresso--${sobe ? 'sobe' : cai ? 'cai' : 'igual'}`}><span className="progresso__glifo" aria-hidden>{sobe ? '↗' : cai ? '↘' : '→'}</span><span className="sr-only">{sobe ? 'Melhorou: ' : cai ? 'Piorou: ' : 'Sem mudança: '}</span>{texto}</p>;
}

/** O botão de um passo: uma ação do motor, ou ir a outro lugar da tela. */
function BotaoPasso({ vida, passo, agir, ir }: { vida: Vida; passo: PassoDoCaminho; agir: (a: Acao) => boolean; ir: (d: string) => void }) {
  if (passo.acao) return <BotaoAcao vida={vida} acao={passo.acao} agir={agir} variante="principal">{passo.rotulo}</BotaoAcao>;
  if (passo.ir) return <button type="button" className="botao botao--secundario" onClick={() => ir(passo.ir!)}>{passo.rotulo} <span aria-hidden>→</span></button>;
  return null;
}

/** O que esta vida está construindo: intenção, onde está, se está melhorando, o que falta, o próximo passo. */
export function EmConstrucao({ vida, lista, agir, ir }: { vida: Vida; lista: CaminhoEmConstrucao[]; agir: (a: Acao) => boolean; ir: (d: string) => void }) {
  if (!lista.length) return null;
  return (
    <section className="camada camada--construindo" aria-labelledby="camada-construindo">
      <h2 id="camada-construindo" className="camada__titulo">O que você está construindo</h2>
      <ul className="construindo">
        {lista.map(c => (
          <li key={c.id} className={`construindo__item construindo__item--${c.id}`}>
            <h3 className="construindo__titulo">{c.titulo}</h3>
            <p className="construindo__onde">{c.onde}</p>
            <Progresso texto={c.progresso} />
            {c.falta.length > 0 && (
              <div className="construindo__falta">
                <p className="construindo__rotulo">O que falta</p>
                <ul>{c.falta.map((f, k) => <li key={k}>{f}</li>)}</ul>
              </div>
            )}
            {c.proximo && (
              <div className="construindo__passo">
                <BotaoPasso vida={vida} passo={c.proximo} agir={agir} ir={ir} />
                {c.proximo.porque && <p className="construindo__porque">{c.proximo.porque}</p>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

const ESTADO_CAMINHO: Record<CaminhoPossivel['estado'], string> = { aqui: 'Já é a sua vida', pronto: 'Dá para começar', preparar: 'Há o que fazer antes', fora: 'Fora do alcance agora' };

/** Por onde se começa cada vida diferente — para esta vida, agora. */
export function CaminhosPossiveis({ vida, lista, agir, ir }: { vida: Vida; lista: CaminhoPossivel[]; agir: (a: Acao) => boolean; ir: (d: string) => void }) {
  const ordem = { pronto: 0, preparar: 1, aqui: 2, fora: 3 } as const;
  return (
    <div className="explorar-bloco">
      <p className="dica">Nenhuma dessas vidas vem garantida. Aqui está como cada uma costuma começar — e o primeiro passo, do ponto em que você está.</p>
      <ul className="caminhos">
        {[...lista].sort((a, b) => ordem[a.estado] - ordem[b.estado]).map(c => (
          <li key={c.id} className={`caminho caminho--${c.estado}`}>
            <div className="caminho__cabeca">
              <h3 className="caminho__titulo">{c.titulo}</h3>
              <span className="caminho__estado">{ESTADO_CAMINHO[c.estado]}</span>
            </div>
            <p className="caminho__como">{c.como}</p>
            <p className="caminho__agora">{c.agora}</p>
            {c.passo && <div className="caminho__passo"><BotaoPasso vida={vida} passo={c.passo} agir={agir} ir={ir} />{c.passo.porque && <p className="construindo__porque">{c.passo.porque}</p>}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** O que o currículo diz para esta vaga: a palavra de compatibilidade, o que pesa a favor e contra. */
export function PerfilDaVaga({ perfil, curto }: { perfil: PerfilVaga; curto?: boolean }) {
  const fortes = curto ? perfil.fortes.slice(0, 1) : perfil.fortes;
  const fracos = curto ? perfil.fracos.slice(0, 1) : perfil.fracos;
  return (
    <div className="perfil-vaga">
      <p className="perfil-vaga__palavra"><span className="perfil-vaga__rotulo">Seu currículo para esta vaga:</span> {perfil.palavra}</p>
      {(fortes.length > 0 || fracos.length > 0) && (
        <ul className="perfil-vaga__lista">
          {fortes.map((f, k) => <li key={`f${k}`} className="perfil-vaga__forte"><span aria-hidden>+ </span><span className="sr-only">A favor: </span>{f}</li>)}
          {fracos.map((f, k) => <li key={`c${k}`} className="perfil-vaga__fraco"><span aria-hidden>− </span><span className="sr-only">Contra: </span>{f}</li>)}
        </ul>
      )}
    </div>
  );
}

/** Um bloco de vagas com título e dica (as camadas da procura). */
export function BlocoDeVagas({ titulo, dica, children }: { titulo: string; dica?: string; children: ReactNode }) {
  return (
    <section className="bloco-vagas">
      <h3 className="bloco-vagas__titulo">{titulo}</h3>
      {dica && <p className="bloco-vagas__dica">{dica}</p>}
      {children}
    </section>
  );
}
