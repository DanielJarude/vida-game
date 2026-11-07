/**
 * O momento de decidir. Abre por cima de tudo; depois da escolha, o
 * resultado aparece no mesmo lugar antes de a vida seguir.
 */

import type { Desfecho13, Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { Folha } from '../comum';
import { Retrato } from '../avatar/Retrato';
import { idadePessoa } from '../../motor/nucleo';
import { rotuloDe } from '../apresentar';
import { dinheiroCurto, TEMA_ROTULO } from '../apresentar';
import '../acoes13.css';


export function Momento({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const m = vida.momento!;
  const pessoas = Object.values(m.papeis).map(id => vida.pessoas[id]).filter(Boolean);
  // REWORK 11.5 · EVT-01: o ano pode ter mais de uma decisão — quem decide sabe que há outra esperando (conferida de novo
  // antes de abrir: pode não vir, se esta escolha a desfizer).
  const esperando = (vida.fila ?? []).filter(x => x.t === vida.t).length;
  return (
    <Folha rotulo={m.titulo} fechavel={false} papel>
      <div className="momento">
        <p className="momento__tema">{/^comp_/.test(m.situacaoId) ? 'Duas coisas que não cabem juntas' : /^pol_/.test(m.situacaoId) ? 'Vida pública' : /^neg/.test(m.situacaoId) ? 'O negócio' : /^esp_/.test(m.situacaoId) ? 'Esporte' : /^mil_/.test(m.situacaoId) ? 'A farda' : /^pet_/.test(m.situacaoId) ? 'Os bichos' : TEMA_ROTULO[m.tema] ?? ''}</p>
        <h2 className="momento__titulo">{m.titulo}</h2>
        {pessoas.length > 0 && (
          <div className="momento__pessoas">
            {pessoas.map(p => (
              <figure key={p.id} className="momento__pessoa">
                <Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.pet?.semente ?? p.id} tamanho={56} especie={p.especie} porte={p.pet?.porte} rotulo={p.nome || 'Bebê'} />
                <figcaption>
                  <span>{p.nome || 'bebê'}</span>
                  {vida.vinculos[p.id] && <span className="momento__relacao">{rotuloDe(vida, p, vida.vinculos[p.id])}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        <p className="momento__texto">{m.texto}</p>
        <p className="momento__pergunta"><span className="momento__vez">Sua vez</span> <span>{m.situacaoId === 'trab_entrevista' ? 'O que você responde?' : m.situacaoId === 'esp_peneira' ? 'Como você joga?' : m.situacaoId === 'pol_eleicao' ? 'Como você faz?' : 'O que você faz?'}</span></p>
        {esperando > 0 && <p className="momento__fila">{esperando === 1 ? 'Este ano ainda tem outro assunto esperando por você. Antes dele, você vê o que esta escolha deu.' : `Este ano ainda tem outros ${esperando} assuntos esperando por você. Um de cada vez: antes do próximo, você vê o que esta escolha deu.`}</p>}
        <ul className="momento__opcoes">
          {m.opcoes.map(o => (
            <li key={o.id}>
              <button type="button" className="opcao" disabled={!!o.bloqueio} onClick={() => agir({ tipo: 'decidir', opcaoId: o.id, umaPorVez: true, momentoId: m.id })}>
                <span className="opcao__texto">{o.texto}</span>
                {o.detalhe && !o.bloqueio && <span className="opcao__detalhe"><span className="opcao__seta" aria-hidden>→ </span>{o.detalhe}</span>}
                {o.bloqueio && <span className="opcao__bloqueio">{o.bloqueio}</span>}
              </button>
              {o.bloqueio && o.resgate && <button type="button" className="botao botao--discreto opcao__resgate" onClick={() => agir({ tipo: 'decidir', opcaoId: o.id, resgatar: true, umaPorVez: true, momentoId: m.id })}>Tirar {dinheiroCurto(o.resgate)} das aplicações e escolher isto</button>}
            </li>
          ))}
        </ul>
      </div>
    </Folha>
  );
}

/** VIDA 13 · Ações: a conta (ou o caixa) antes e depois, em palavras: o que saiu, o que entrou, como ficou. */
function LinhaDeDinheiro({ rotulo, antes, depois, divida }: { rotulo: string; antes: number; depois: number; divida?: boolean }) {
  const d = depois - antes;
  const ruim = divida ? d > 0 : d < 0;
  return (
    <li className="desfecho__dinheiro">
      <span className="desfecho__dinheiro-rotulo">{rotulo}</span>
      <span className={`desfecho__delta desfecho__delta--${ruim ? 'saiu' : 'entrou'}`}><span aria-hidden>{d < 0 ? '−' : '+'}</span><span className="sr-only">{divida ? (d > 0 ? 'Aumentou ' : 'Diminuiu ') : d < 0 ? 'Saiu ' : 'Entrou '}</span>{dinheiroCurto(Math.abs(d))}</span>
      <span className="desfecho__agora">agora {dinheiroCurto(depois)}</span>
    </li>
  );
}

/**
 * O resultado de uma escolha, logo depois dela. VIDA 13 · Ações: com `desfecho`, diz também o que foi escolhido, o que
 * custou, como ficou a conta, o que mudou e o que esperar; com `aoSeguir`, a próxima decisão do ano espera atrás dele
 * (uma de cada vez) e dá para deixar o resto para depois.
 */
export function Resultado({ titulo, texto, aoFechar, vida, pessoaId, mudancas, desfecho, aoEncerrar }: { titulo: string; texto: string; aoFechar: () => void; vida?: Vida; pessoaId?: string; mudancas?: string[]; desfecho?: Desfecho13; aoEncerrar?: () => void }) {
  const p = pessoaId && vida ? vida.pessoas[pessoaId] : undefined;
  const restantes = desfecho?.restantes ?? 0;
  const urgentes = desfecho?.urgentes ?? 0;
  const etapa = !!vida?.momento;
  const esperado = desfecho?.esperado ?? [];
  return (
    <Folha rotulo={`Resultado: ${titulo}`} aoFechar={aoFechar} fechavel papel>
      <div className="momento momento--resultado">
        {p && vida && (
          <div className="momento__pessoas">
            <figure className="momento__pessoa">
              <Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.pet?.semente ?? p.id} tamanho={64} especie={p.especie} porte={p.pet?.porte} rotulo={p.nome} />
              <figcaption><span>{p.nome}</span>{vida.vinculos[p.id] && <span className="momento__relacao">{rotuloDe(vida, p, vida.vinculos[p.id])}</span>}</figcaption>
            </figure>
          </div>
        )}
        <p className="momento__tema">{titulo}</p>
        {desfecho?.escolha && <p className="desfecho__escolha"><span className="desfecho__rotulo">Você escolheu</span> {desfecho.escolha}</p>}
        {texto && <p className="momento__resultado">{texto}</p>}
        {(desfecho?.conta || desfecho?.caixa || desfecho?.dividas) && (
          <ul className="desfecho__contas" aria-label="O dinheiro">
            {desfecho.conta && <LinhaDeDinheiro rotulo="Sua conta" antes={desfecho.conta.antes} depois={desfecho.conta.depois} />}
            {desfecho.dividas && <LinhaDeDinheiro rotulo="Suas dívidas" antes={desfecho.dividas.antes} depois={desfecho.dividas.depois} divida />}
            {desfecho.caixa && <LinhaDeDinheiro rotulo={`Caixa de ${desfecho.caixa.nome}`} antes={desfecho.caixa.antes} depois={desfecho.caixa.depois} />}
          </ul>
        )}
        {mudancas && mudancas.length > 0 && (
          <div className="mudancas">
            <p className="mudancas__titulo">O que mudou na sua vida</p>
            <ul>{mudancas.map((x, k) => <li key={k}>{x}</li>)}</ul>
          </div>
        )}
        {esperado.length > 0 && (
          <div className="desfecho__esperado">
            <p className="mudancas__titulo">O que esperar</p>
            <ul>{esperado.map((x, k) => <li key={k}>{x}</li>)}</ul>
          </div>
        )}
        {restantes > 0 && !etapa && (
          <p className="desfecho__fila">{restantes === 1 ? 'Ainda há mais uma decisão neste ano' : `Ainda há mais ${restantes} decisões neste ano`}{urgentes ? (urgentes === restantes ? (restantes === 1 ? ', e ela não pode esperar.' : ', e elas não podem esperar.') : ` (${urgentes === 1 ? 'uma não pode esperar' : `${urgentes} não podem esperar`}).`) : '. A próxima já leva em conta o que acabou de acontecer.'}</p>
        )}
        <div className="desfecho__botoes">
          <button type="button" className="botao botao--principal" onClick={aoFechar}>{restantes > 0 && !etapa ? 'Próxima decisão' : 'Continuar'}</button>
          {aoEncerrar && restantes > urgentes && !etapa && <button type="button" className="botao botao--secundario" onClick={aoEncerrar}>{urgentes ? 'Deixar as outras para depois' : restantes === 1 ? 'Deixar para depois' : 'Deixar o resto para depois'}</button>}
        </div>
      </div>
    </Folha>
  );
}
