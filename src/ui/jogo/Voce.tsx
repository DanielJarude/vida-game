/**
 * Você: a pessoa, não as métricas.
 *
 * O rosto em primeiro lugar (com a expressão do momento), a fase da vida e
 * uma frase sobre agora. Depois, Humor, Cabeça e Saúde como três leituras:
 * uma palavra, uma escala que não depende de cor, a tendência, o que tem
 * ajudado, o que tem pesado — e o que dá para fazer a respeito. Os cuidados
 * vêm das causas: sobrecarga pede tirar algo da semana; luto pede gente perto.
 */

import { redeDeSaude } from '../../motor/sistemas/saude';
import { QuemNoMundo } from './Mundo';
import { imagemPublica, leituraDoNome } from '../../motor/sistemas/notoriedade';
import { USOS } from '../../motor/sistemas/visibilidade';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { disponibilidade } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { tracosMarcantes } from '../../motor/personalidade';
import type { Dimensao } from '../../motor/sistemas/estado';
import { Retrato } from '../avatar/Retrato';
import { BotaoAcao, Vazio } from '../comum';
import { faseDaVida, ocupacaoAtual, ondeMora } from '../apresentar';
import { lutoVisivel, situacaoAfetiva } from '../leitura';
import { expressaoDe, lerDimensao, noQueEBom, lerPessoal, momentoAtual, palavraTendencia, type LeituraDimensao } from '../estadoPessoal';
import { sinaisDoCorpo } from '../../motor/sistemas/saude';
import type { DimensaoPessoal } from '../../motor/sistemas/pessoa';
import { anoDe } from '../../motor/tempo';
import { AparenciaEEstilo } from './Aparencia';
import { OQueConstruiu } from './Trajetorias';
import { Linhagem } from './Linhagem';
import { leituraDaSeguranca } from '../leituraMaterial';
import type { Aba } from '../navegacao';

export type Destino = Aba;

interface Props { vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Destino) => void; abrirPessoa: (id: string) => void }

export function Voce({ vida, agir, irPara, abrirPessoa }: Props) {
  const i = idade(vida);
  const dims: Dimensao[] = i >= 10 ? ['humor', 'cabeca', 'saude'] : ['humor', 'saude'];
  const leituras = dims.map(d => lerDimensao(vida, d));
  const tracos = tracosMarcantes(vida);
  const afeto = situacaoAfetiva(vida);
  const luto = lutoVisivel(vida);
  // Só o que tem nome é "condição"; o resto é sinal (e o cuidado é ir ao médico).
  const condicoes = vida.corpo.condicoes.filter(c => c.diagnosticada !== false);
  const sinais = sinaisDoCorpo(vida);
  const pessoais: DimensaoPessoal[] = [...(i >= 6 ? ['condicionamento' as const] : []), ...(i >= 7 ? ['aprendizado' as const] : []), ...(i >= 14 ? ['aparencia' as const] : [])];
  return (
    <div className="voce">
      <section className="voce-rosto" aria-label="Como você está">
        <Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? "eu"} tamanho={176} rotulo={`${vida.eu.nome} aos ${i}`} expressao={expressaoDe(vida)} />
        <div className="voce-rosto__texto">
          <p className="folio__kicker"><span className="folio__area">Você</span> · {i} {i === 1 ? 'ano' : 'anos'} · {faseDaVida(i)}</p>
          <h1 className="voce-rosto__momento">{momentoAtual(vida)}</h1>
          <p className="voce-rosto__linha">{ocupacaoAtual(vida)} · {ondeMora(vida)}</p>
          {afeto && <p className="voce-rosto__linha">{afeto}{luto ? ` · ${luto}` : ''}</p>}
          {leituraDoNome(vida) && <p className="voce-rosto__linha">Para o público: {leituraDoNome(vida)!.frase}</p>}
          {(() => { const im = imagemPublica(vida); return im ? <p className="voce-rosto__linha">Imagem pública: {im.palavra} — {im.texto.charAt(0).toLowerCase() + im.texto.slice(1)}</p> : null; })()}
        </div>
      </section>

      <div className={`estados estados--${leituras.length}`}>
        {leituras.map(l => <Estado key={l.d} l={l} vida={vida} agir={agir} irPara={irPara} abrirPessoa={abrirPessoa} />)}
      </div>

      {pessoais.length > 0 && <CorpoEAprendizado vida={vida} dims={pessoais} irPara={irPara} />}

      {(() => { const bom = noQueEBom(vida); return bom.length ? (
        <section className="voce-bom" aria-labelledby="titulo-bom">
          <h2 id="titulo-bom" className="voce-subtitulo">No que você é bom</h2>
          <dl className="dados">{bom.map(x => <div key={x.rotulo} className="dado"><dt>{x.rotulo}</dt><dd>{x.texto}</dd></div>)}</dl>
        </section>
      ) : null; })()}

      {sinais.length > 0 && (
        <section className="voce-condicoes voce-sinais" aria-label="Sinais do corpo">
          <h2 className="voce-subtitulo">O corpo tem dado sinais</h2>
          <ul>
            {sinais.map(x => <li key={x.id}><strong>{x.texto.charAt(0).toUpperCase() + x.texto.slice(1)}</strong><span>desde {anoDe(x.desde)}</span></li>)}
          </ul>
          <p className="nota">Ainda sem nome. Ir ao médico é o que dá diagnóstico — e tratamento. Ignorar também é escolha: às vezes passa, às vezes o corpo cobra depois.</p>
          {i >= 12 && <div className="grupo-acoes"><BotaoAcao vida={vida} acao={{ tipo: 'cuidar', cuidado: 'consulta' }} agir={agir} variante="secundario" ocultarImpossivel>{i < 18 ? 'Pedir ajuda: contar em casa ou na escola e ir ao posto de saúde' : 'Ir ao médico ver o que é'}</BotaoAcao></div>}
          {i < 18 && <p className="nota">{redeDeSaude(vida).sistema === 'seguro' ? 'O pediatra do plano (ou a clínica comunitária, para quem não tem) atende — e, quando precisa, encaminha para acompanhamento.' : `No posto de saúde (${redeDeSaude(vida).nome}), o atendimento é de graça — e, quando precisa, encaminha para acompanhamento.`}</p>}
        </section>
      )}

      {i >= 8 && (
        <section className="voce-dinheiro" aria-label="O dinheiro">
          <button type="button" className="voce-dinheiro__ir" onClick={() => irPara('dinheiro')}>
            <span className="rotulo-pequeno">O dinheiro</span>
            <strong>{leituraDaSeguranca(vida).palavra}</strong>
            <span className="nota">o mês, o que é seu e o que deve — em Vida · Dinheiro →</span>
          </button>
        </section>
      )}

      <AparenciaEEstilo vida={vida} agir={agir} irPara={irPara} />
      <OSeuNome vida={vida} agir={agir} />
      <QuemNoMundo vida={vida} agir={agir} />
      {i >= 14 && <OQueConstruiu vida={vida} />}
      <Linhagem vida={vida} />

      {condicoes.length > 0 && (
        <section className="voce-condicoes" aria-label="Condições de saúde">
          <h2 className="voce-subtitulo">O que o corpo carrega</h2>
          <ul>
            {condicoes.map(c => (
              <li key={c.id}>
                <strong>{c.nome.charAt(0).toUpperCase() + c.nome.slice(1)}</strong>
                <span>{c.tratando ? 'em tratamento' : vida.processos.some(p => p.tipo === 'tratamento' && p.condicaoId === c.id) ? `na fila ${redeDeSaude(vida).do}` : c.cronica ? 'sem tratamento' : 'passando'}{c.cronica ? '' : ' · deve passar'}{c.tarde ? ' · descoberto tarde' : ''}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tracos.length > 0 && (
        <p className="voce-tracos">Quem convive diz que você é {tracos.join(', ').replace(/, ([^,]*)$/, ' e $1')} — é o que suas escolhas têm mostrado.</p>
      )}
    </div>
  );
}

function Escala({ nivel, nome }: { nivel: number; nome: string }) {
  return (
    <span className="escala" role="img" aria-label={`${nome}: ${nivel} de 5`}>
      {[1, 2, 3, 4, 5].map(k => <span key={k} className={`escala__marca${k <= nivel ? ' escala__marca--cheia' : ''}`} />)}
    </span>
  );
}

function Estado({ l, vida, agir, irPara, abrirPessoa }: { l: LeituraDimensao; vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Destino) => void; abrirPessoa: (id: string) => void }) {
  const t = palavraTendencia(l.tendencia);
  const vazio = !l.ajudando.length && !l.pesando.length;
  return (
    <article className={`estado-bloco estado-bloco--${l.d} estado-bloco--n${l.nivel}`} aria-labelledby={`estado-${l.d}`}>
      <header className="estado-bloco__cabeca">
        <h2 id={`estado-${l.d}`} className="estado-bloco__nome">{l.nome}</h2>
        {t && <span className={`estado-bloco__tendencia estado-bloco__tendencia--${l.tendencia}`}>{l.tendencia === 'melhorando' ? '↗ ' : l.tendencia === 'piorando' ? '↘ ' : ''}{t}</span>}
      </header>
      <p className="estado-bloco__palavra">{l.palavra}</p>
      <Escala nivel={l.nivel} nome={l.nome} />
      {l.pesando.length > 0 && (
        <div className="estado-bloco__lista">
          <h3>Tem pesado</h3>
          <ul>{l.pesando.map(f => <li key={f.id}>{f.pessoaId && vida.pessoas[f.pessoaId] ? <button type="button" className="link" onClick={() => abrirPessoa(f.pessoaId!)}>{f.texto}</button> : f.texto}{f.pontual ? <span className="estado-bloco__quando"> · este ano</span> : null}</li>)}</ul>
        </div>
      )}
      {l.ajudando.length > 0 && (
        <div className="estado-bloco__lista estado-bloco__lista--bom">
          <h3>Tem ajudado</h3>
          <ul>{l.ajudando.map(f => <li key={f.id}>{f.pessoaId && vida.pessoas[f.pessoaId] ? <button type="button" className="link" onClick={() => abrirPessoa(f.pessoaId!)}>{f.texto}</button> : f.texto}</li>)}</ul>
        </div>
      )}
      {vazio && <Vazio>Nada pesando muito, nada puxando muito.</Vazio>}
      {l.cuidados.length > 0 && (
        <div className="estado-bloco__cuidar">
          {l.cuidados.map(s => s.acao
            ? <BotaoAcao key={s.id} vida={vida} acao={s.acao} agir={agir} variante="secundario" ocultarImpossivel>{s.texto}</BotaoAcao>
            : <button key={s.id} type="button" className="botao botao--discreto" onClick={() => (s.pessoaId ? abrirPessoa(s.pessoaId) : s.aba ? irPara(s.aba) : undefined)}>{s.texto} →</button>)}
          {l.cuidados[0]?.motivo && <p className="estado-bloco__motivo">{l.cuidados[0].motivo}</p>}
        </div>
      )}
    </article>
  );
}

/**
 * Condicionamento, aprendizado e aparência: o que é, o que tem mexido nisso
 * (as causas do motor) e para que serve — com o caminho para mexer.
 */
function CorpoEAprendizado({ vida, dims, irPara }: { vida: Vida; dims: DimensaoPessoal[]; irPara: (a: Destino) => void }) {
  const leituras = dims.map(d => lerPessoal(vida, d));
  return (
    <section className="voce-pessoal" aria-labelledby="titulo-pessoal">
      <h2 id="titulo-pessoal" className="voce-subtitulo">Corpo e aprendizado</h2>
      <ul className="pessoal">
        {leituras.map(l => (
          <li key={l.d} className="pessoal__item">
            <p className="pessoal__cabeca">
              <strong className="pessoal__nome">{l.nome}</strong>
              <span className="pessoal__palavra">{l.palavra}</span>
              {l.tendencia === 'melhorando' || l.tendencia === 'piorando' ? <span className={`estado-bloco__tendencia estado-bloco__tendencia--${l.tendencia}`}>{l.tendencia === 'melhorando' ? '↗ vem melhorando' : '↘ vem piorando'}</span> : null}
            </p>
            {l.causas && <p className="pessoal__causas">{l.causas}</p>}
            <p className="pessoal__uso">{l.uso}</p>
            {l.ir && <button type="button" className="link pessoal__ir" onClick={() => irPara(l.ir!.aba)}>{l.ir.rotulo} →</button>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * O seu nome (Fama 2.0): quem o público conhece pode decidir o que fazer com
 * isso — e o resultado não é garantido (`visibilidade`). Só aparece para
 * quem tem nome; o que não cabe agora fica de fora.
 */
function OSeuNome({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const nome = leituraDoNome(vida);
  if (!nome || nome.valor < 15) return null;
  return (
    <section className="visibilidade" aria-labelledby="titulo-visibilidade">
      <h2 id="titulo-visibilidade" className="secao-fio">O seu nome</h2>
      <p className="nota">Para o público: {nome.frase}. O que você faz com isso muda a imagem, a cabeça — e, às vezes, nada.</p>
      <ul className="experiencias__lista">
        {USOS.filter(u => disponibilidade(vida, { tipo: 'visibilidade', oque: u.id }).grau !== 'impossivel').map(u => (
          <li key={u.id} className="experiencia">
            <span className="experiencia__texto"><strong>{u.rotulo}</strong><span>{u.descricao}</span></span>
            <BotaoAcao vida={vida} acao={{ tipo: 'visibilidade', oque: u.id }} agir={agir} variante="discreto">{u.id === 'privacidade' ? 'Recolher-se' : 'Fazer'}</BotaoAcao>
          </li>
        ))}
      </ul>
    </section>
  );
}
