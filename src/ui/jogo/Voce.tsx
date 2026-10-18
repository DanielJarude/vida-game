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
import type { Dominio, Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { disponibilidade } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { tracosMarcantes } from '../../motor/personalidade';
import type { Dimensao } from '../../motor/sistemas/estado';
import { FichaDeHabilidade } from './Progresso';
import { ResumoDaRotina } from './Rotina';
import { evolucaoDaFrente } from '../../motor/sistemas/progressao';
import { MATERIAS } from '../../motor/dados/frentes';
import { Retrato } from '../avatar/Retrato';
import { BotaoAcao, Vazio } from '../comum';
import { frentesDaVida } from '../../motor/sistemas/frentes';
import { faseDaVida, ocupacaoAtual, ondeMora } from '../apresentar';
import { lutoVisivel, situacaoAfetiva } from '../leitura';
import { expressaoDe, lerDimensao, noQueEBom, lerPessoal, momentoAtual, palavraTendencia, trajetoria, USO_DIMENSAO, type LeituraDimensao } from '../estadoPessoal';
import { sinaisDoCorpo } from '../../motor/sistemas/saude';
import { nivelPessoal, type DimensaoPessoal } from '../../motor/sistemas/pessoa';
import { anoDe } from '../../motor/tempo';
import { AparenciaEEstilo } from './Aparencia';
import { OQueConstruiu } from './Trajetorias';
import { Linhagem } from './Linhagem';
import { Medidor } from './Sinais';
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
        <Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? "eu"} tamanho={132} rotulo={`${vida.eu.nome} aos ${i}`} expressao={expressaoDe(vida)} />
        <div className="voce-rosto__texto">
          <p className="folio__kicker"><span className="folio__area">Você</span> · {i} {i === 1 ? 'ano' : 'anos'} · {faseDaVida(i)}</p>
          <h1 className="voce-rosto__momento">{momentoAtual(vida)}</h1>
          <p className="voce-rosto__linha">{ocupacaoAtual(vida)} · {ondeMora(vida)}</p>
          {afeto && <p className="voce-rosto__linha">{afeto}{luto ? ` · ${luto}` : ''}</p>}
          {leituraDoNome(vida) && <p className="voce-rosto__linha">Para o público: {leituraDoNome(vida)!.frase}</p>}
          {(() => { const im = imagemPublica(vida); return im ? <p className="voce-rosto__linha">Imagem pública: {im.palavra} — {im.texto.charAt(0).toLowerCase() + im.texto.slice(1)}</p> : null; })()}
        </div>
      </section>

      {/* REWORK 9: o retrato em partes — um índice curto leva a cada uma (a página é longa numa vida longa). */}
      <nav className="voce-indice" aria-label="Partes do retrato">
        <a href="#voce-agora">Como está</a>
        {pessoais.length > 0 && <a href="#voce-corpo">Corpo e aprendizado</a>}
        <a href="#voce-sabe">O que sabe fazer</a>
        {tracos.length > 0 && <a href="#titulo-jeito">O seu jeito</a>}
        {(sinais.length > 0 || condicoes.length > 0) && <a href="#voce-saude">Saúde</a>}
        <a href="#voce-aparencia">Aparência</a>
        <a href="#voce-mundo">No mundo</a>
      </nav>

      <div id="voce-agora" className={`estados estados--${leituras.length}`}>
        {leituras.map(l => <Estado key={l.d} l={l} vida={vida} agir={agir} irPara={irPara} abrirPessoa={abrirPessoa} />)}
      </div>
      {/* REWORK 9.5 · ROT-01: a cabeça e o corpo vivem a mesma semana — a mesma leitura da rotina de Minha Semana. */}
      {i >= 6 && <ResumoDaRotina vida={vida} irPara={() => irPara('semana')} />}

      {pessoais.length > 0 && <div id="voce-corpo"><CorpoEAprendizado vida={vida} dims={pessoais} irPara={irPara} /></div>}

      {/* REWORK 7: o que a pessoa SABE FAZER, com os degraus de cada habilidade (a mesma escada da ficha da prática) —
          e, ao lado, os jeitos de nascença que o motor guarda. Antes eram linhas de texto soltas. */}
      {/* REWORK 9.5 · UX-03: uma ficha por habilidade (o nível, a frase, o que mudou no ano e por quê, o histórico) — antes
          eram duas listas das mesmas frentes (os degraus e o "ano a ano"). */}
      <div id="voce-sabe"><Habilidades vida={vida} irPara={irPara} /></div>

      {tracos.length > 0 && (
        <section className="voce-jeito" aria-labelledby="titulo-jeito">
          <h2 id="titulo-jeito" className="voce-subtitulo">O seu jeito</h2>
          <ul className="voce-jeito__tracos">{tracos.map(t => <li key={t}>{t}</li>)}</ul>
          <p className="voce-tracos">Quem convive diz que você é {tracos.join(', ').replace(/, ([^,]*)$/, ' e $1')} — é o que suas escolhas têm mostrado.</p>
        </section>
      )}

      {(sinais.length > 0 || condicoes.length > 0) && (
        <div id="voce-saude" className="voce-saude">
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
        </div>
      )}

      <div id="voce-aparencia"><AparenciaEEstilo vida={vida} agir={agir} irPara={irPara} /></div>

      {i >= 8 && (
        <section className="voce-dinheiro" aria-label="O dinheiro">
          <button type="button" className="voce-dinheiro__ir" onClick={() => irPara('dinheiro')}>
            <span className="rotulo-pequeno">O dinheiro</span>
            <strong>{leituraDaSeguranca(vida).palavra}</strong>
            <span className="nota">o mês, o que é seu e o que deve — em Vida · Dinheiro →</span>
          </button>
        </section>
      )}

      <OSeuNome vida={vida} agir={agir} />
      <div id="voce-mundo"><QuemNoMundo vida={vida} agir={agir} /></div>
      {i >= 14 && <OQueConstruiu vida={vida} />}
      <Linhagem vida={vida} />
    </div>
  );
}

/**
 * REWORK 5 — a linha dos últimos anos (o registro de cada aniversário + agora), sem número: subir é melhorar em todas.
 * O último ponto é o de hoje. Com menos de dois registros, não há linha para desenhar.
 */
export function Trajetoria({ pontos, nome }: { pontos: number[]; nome: string }) {
  if (pontos.length < 2) return null;
  const L = 240, A = 28;
  const x = (k: number) => (k / (pontos.length - 1)) * (L - 6) + 3;
  const y = (p: number) => A - 3 - (p / 100) * (A - 6);
  const d = pontos.map((p, k) => `${k ? 'L' : 'M'}${x(k).toFixed(1)} ${y(p).toFixed(1)}`).join(' ');
  const ultimo = pontos[pontos.length - 1];
  const dir = ultimo - pontos[0];
  // REWORK 6.5: a linha ocupa a largura do cartão e diz o que é (antes, 160 px soltos num cartão largo, sem legenda).
  return (
    <figure className="linha-estado__quadro">
    <svg className={`linha-estado linha-estado--${dir >= 6 ? 'sobe' : dir <= -6 ? 'desce' : 'estavel'}`} viewBox={`0 0 ${L} ${A}`} role="img" aria-label={`${nome} nos últimos ${pontos.length - 1} anos: ${dir >= 6 ? 'subiu' : dir <= -6 ? 'caiu' : 'ficou parecido'}`}>
      <line className="linha-estado__meio" x1="3" x2={L - 3} y1={y(50)} y2={y(50)} />
      <path className="linha-estado__linha" d={d} />
      <circle className="linha-estado__agora" cx={x(pontos.length - 1)} cy={y(ultimo)} r="2.6" />
    </svg>
    <figcaption className="linha-estado__legenda" aria-hidden><span>há {pontos.length - 1} {pontos.length - 1 === 1 ? 'ano' : 'anos'}</span><span>agora</span></figcaption>
    </figure>
  );
}

function Estado({ l, vida, agir, irPara, abrirPessoa }: { l: LeituraDimensao; vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Destino) => void; abrirPessoa: (id: string) => void }) {
  const t = palavraTendencia(l.tendencia);
  const vazio = !l.ajudando.length && !l.pesando.length;
  // REWORK 6 — divulgação progressiva: o bloco abre sozinho quando pede atenção (nível baixo, piorando, ou há o que
  // fazer); o resto fica fechado no resumo (nome, palavra, tendência) e abre com um toque.
  const atencao = l.nivel <= 2 || l.tendencia === 'piorando' || l.cuidados.length > 0;
  return (
    <details className={`estado-bloco estado-bloco--${l.d} estado-bloco--n${l.nivel}`} open={atencao} aria-labelledby={`estado-${l.d}`}>
      <summary className="estado-bloco__resumo">
        <h2 id={`estado-${l.d}`} className="estado-bloco__nome">{l.nome}</h2>
        {t && <span className={`estado-bloco__tendencia estado-bloco__tendencia--${l.tendencia}`}>{l.tendencia === 'melhorando' ? '↗ ' : l.tendencia === 'piorando' ? '↘ ' : ''}{t}</span>}
        <span className="estado-bloco__palavra">{l.palavra}</span>
        <Medidor nivel={l.nivel} nome={l.nome} />
      </summary>
      <div className="estado-bloco__detalhe">
        <Trajetoria pontos={trajetoria(vida, l.d)} nome={l.nome} />
        <p className="estado-bloco__uso">{USO_DIMENSAO[l.d]}</p>
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
      </div>
    </details>
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
              <Medidor nivel={nivelPessoal(vida, l.d)} nome={l.nome} />
              {l.tendencia === 'melhorando' || l.tendencia === 'piorando' ? <span className={`estado-bloco__tendencia estado-bloco__tendencia--${l.tendencia}`}>{l.tendencia === 'melhorando' ? '↗ vem melhorando' : '↘ vem piorando'}</span> : null}
            </p>
            <Trajetoria pontos={trajetoria(vida, l.d === 'condicionamento' ? 'forma' : l.d === 'aprendizado' ? 'cognicao' : 'aparencia')} nome={l.nome} />
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


/**
 * REWORK 7 — "No que você é bom", com forma: cada habilidade que conta na vida (as praticadas e as que já foram
 * fortes — `frentesDaVida`) com os degraus da escada real, a palavra do estágio e se está praticando ou parou; os
 * jeitos de nascença e a cabeça para aprender (`noQueEBom`), em palavras, ao lado. Um toque leva a Minha Semana.
 */
function Habilidades({ vida, irPara }: { vida: Vida; irPara: (a: Destino) => void }) {
  const frentes = frentesDaVida(vida);
  const jeitos = noQueEBom(vida).filter(x => !frentes.some(f => cap(f.nome) === x.rotulo));
  // As outras habilidades (fora da escola) que o motor guarda: a um toque, com a mesma ficha.
  const outras = (Object.keys(vida.caminhos.frentes) as Dominio[]).filter(d => !MATERIAS.includes(d) && !frentes.some(f => f.d === d));
  if (!frentes.length && !jeitos.length && !outras.length) return null;
  const ficha = (d: Dominio, frase?: string, ativa = true) => { const e = evolucaoDaFrente(vida, d); return e ? <FichaDeHabilidade key={d} vida={vida} e={e} frase={frase} ativa={ativa} /> : null; };
  return (
    <section className="voce-bom" aria-labelledby="titulo-bom">
      <h2 id="titulo-bom" className="voce-subtitulo">No que você é bom</h2>
      {frentes.length > 0 && <ul className="fichas-hab">{frentes.map(f => ficha(f.d, f.texto, f.ativa))}</ul>}
      {outras.length > 0 && (
        <details className="voce-bom__outras">
          <summary>{outras.length === 1 ? 'Outra habilidade' : `Outras ${outras.length} habilidades`} (o que se aprendeu um dia e ficou)</summary>
          <ul className="fichas-hab">{outras.map(d => ficha(d))}</ul>
        </details>
      )}
      {jeitos.length > 0 && <dl className="dados">{jeitos.map(x => <div key={x.rotulo} className="dado"><dt>{x.rotulo}</dt><dd>{x.texto}</dd></div>)}</dl>}
      <button type="button" className="link" onClick={() => irPara('atividades')}>Praticar algo — em Minha Semana →</button>
    </section>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
