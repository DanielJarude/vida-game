/**
 * Você: a pessoa, não as métricas.
 *
 * REWORK 9.6 · ATR-01: depois do rosto, a FICHA DE ATRIBUTOS (Saúde, Físico, Felicidade, Beleza, Inteligência — de 0 a
 * 100, com as causas de cada um); a cabeça (o estresse) é um sistema à parte, logo abaixo, com o mesmo bloco de antes.
 *
 * O rosto em primeiro lugar (com a expressão do momento), a fase da vida e
 * uma frase sobre agora. Depois, Humor, Cabeça e Saúde como três leituras:
 * uma palavra, uma escala que não depende de cor, a tendência, o que tem
 * ajudado, o que tem pesado — e o que dá para fazer a respeito. Os cuidados
 * vêm das causas: sobrecarga pede tirar algo da semana; luto pede gente perto.
 */

import { sobDemanda } from '../util/sobDemanda';
/** REWORK 12.4: os gostos (música e arte) e o que se faz com eles (pacote sob demanda). */
const GostosECultura = sobDemanda(() => import('./Personalizar').then(m => m.GostosECultura));
import { TratamentoEmCurso } from './Alcance';
import { leituraDaFama13 } from '../../motor/sistemas/reconhecimento13';
import { Fama13 } from './Fama13';
import { redeDeSaude } from '../../motor/sistemas/saude';
import { QuemNoMundo } from './Mundo';
import { leituraDoNome } from '../../motor/sistemas/notoriedade';
import type { Dominio, Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { tracosMarcantes } from '../../motor/personalidade';
import type { Dimensao } from '../../motor/sistemas/estado';
import { FichaDeHabilidade } from './Progresso';
import { ResumoDaRotina } from './Rotina';
import { evolucaoDaFrente } from '../../motor/sistemas/progressao';
import { MATERIAS } from '../../motor/dados/frentes';
import { Retrato } from '../avatar/Retrato';
import { BotaoAcao, Subnav, Vazio } from '../comum';
import { useState } from 'react';
import { frentesDaVida } from '../../motor/sistemas/frentes';
import { faseDaVida, ocupacaoAtual, ondeMora } from '../apresentar';
import { lutoVisivel, situacaoAfetiva } from '../leitura';
import { expressaoDe, lerDimensao, noQueEBom, momentoAtual, palavraTendencia, trajetoria, USO_DIMENSAO, type LeituraDimensao } from '../estadoPessoal';
import { FichaDeAtributos } from './FichaDeAtributos';
import { sinaisDoCorpo } from '../../motor/sistemas/saude';
import { anoDe } from '../../motor/tempo';
import { AparenciaEEstilo } from './Aparencia';
import { sobDemanda as sobDemandaV14 } from '../util/sobDemanda';
const Objetivos14 = sobDemandaV14(() => import('../v14/conquistas/Objetivos14').then(m => m.Objetivos14));
const Mundo14 = sobDemandaV14(() => import('../v14/mundo/Mundo14').then(m => m.Mundo14));
const Crenca14 = sobDemandaV14(() => import('../v14/crencas/Crenca14').then(m => m.Crenca14));
const Dependencias14 = sobDemandaV14(() => import('../v14/crencas/Dependencias14').then(m => m.Dependencias14));
import { OQueConstruiu } from './Trajetorias';
import { Linhagem } from './Linhagem';
import { Medidor } from './Sinais';
import { leituraDaSeguranca } from '../leituraMaterial';
import type { Aba } from '../navegacao';
import { Perfil15 } from '../v15/perfil/Perfil15';
import { Identidade161 } from '../v16/areas/Capas161';

export type Destino = Aba;

/**
 * REWORK 10 · UX-13 — Você em partes. A página única (5 a 7 telas no celular) virou cinco partes, uma de cada vez, com o
 * rosto e o momento sempre no alto: o Resumo (os atributos, a cabeça, a semana, o dinheiro), a Saúde (o prontuário),
 * as Habilidades (e o seu jeito), a Aparência e o Mundo (o nome público, os lugares, o que construiu, a família de antes).
 * O índice de âncoras (que só rolava a página) deu lugar às abas; a parte aberta é guardada pelo Jogo.
 */
export type ParteVoce = 'resumo' | 'saude' | 'habilidades' | 'aparencia' | 'gostos' | 'objetivos' | 'fama' | 'mundo';

interface Props { vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Destino) => void; abrirPessoa: (id: string) => void; parte?: ParteVoce; irParte?: (p: ParteVoce) => void }

export function Voce({ vida, agir, irPara, abrirPessoa, parte: parteDeFora, irParte }: Props) {
  const [parteLocal, setParteLocal] = useState<ParteVoce>('resumo');
  // VIDA 13 · Fama: a parte "Fama" só existe para quem o público conhece (ou tem prestígio, ou público nas redes).
  const fama = leituraDaFama13(vida);
  const pedida = parteDeFora ?? parteLocal;
  const parte = pedida === 'fama' && !fama.relevante ? 'mundo' : pedida;
  const irA = (p: ParteVoce) => { setParteLocal(p); irParte?.(p); };
  const fora = (p: ParteVoce) => `voce__parte voce__parte--${p}${parte === p ? '' : ' voce__parte--fora'}`;
  const i = idade(vida);
  // A cabeça (o estresse) continua uma leitura própria; humor e saúde são atributos, na ficha.
  const dims: Dimensao[] = i >= 10 ? ['cabeca'] : [];
  const leituras = dims.map(d => lerDimensao(vida, d));
  const tracos = tracosMarcantes(vida);
  const afeto = situacaoAfetiva(vida);
  const luto = lutoVisivel(vida);
  // Só o que tem nome é "condição"; o resto é sinal (e o cuidado é ir ao médico).
  const condicoes = vida.corpo.condicoes.filter(c => c.diagnosticada !== false);
  const sinais = sinaisDoCorpo(vida);
  return (
    <div className="voce">
      {/* VIDA 16.1: o perfil numa peça só — a capa, o retrato, a ficha da identidade e os números da vida social. */}
      <section className="perfil161" aria-label="O seu perfil">
      <div className="perfil161__capa" aria-hidden />
      <section className="voce-rosto" aria-label="Como você está">
        <Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? "eu"} tamanho={132} rotulo={`${vida.eu.nome} aos ${i}`} expressao={expressaoDe(vida)} />
        <div className="voce-rosto__texto">
          <p className="folio__kicker"><span className="folio__area">Você</span> · {i} {i === 1 ? 'ano' : 'anos'} · {faseDaVida(i)}</p>
          <h1 className="voce-rosto__momento">{momentoAtual(vida)}</h1>
          <p className="voce-rosto__linha">{ocupacaoAtual(vida)} · {ondeMora(vida)}</p>
          {afeto && <p className="voce-rosto__linha">{afeto}{luto ? ` · ${luto}` : ''}</p>}
          {leituraDoNome(vida) && <p className="voce-rosto__linha">Para o público: {leituraDoNome(vida)!.frase}</p>}
          {/* VIDA 13 · Fama: uma leitura só da imagem — a do núcleo (`reconhecimento13`), a mesma da parte Fama. */}
          {fama.imagem && <p className="voce-rosto__linha">Imagem pública: {fama.imagem.palavra} — {fama.imagem.texto.charAt(0).toLowerCase() + fama.imagem.texto.slice(1)}</p>}
          {fama.relevante && fama.nivel >= 1 && parte !== 'fama' && <button type="button" className="fama13-atalho" onClick={() => irA('fama')}>A sua fama: o que traz, o que cobra, o que fazer com ela →</button>}
        </div>
      </section>

      <Identidade161 vida={vida} />
      {/* VIDA 15: o perfil — os números da vida social e os atalhos (cada um leva à tela que cuida dele). */}
      <Perfil15 vida={vida} irPara={irPara} irParte={irA} />
      </section>

      <Subnav rotulo="Partes do retrato" prefixo="voce" atual={parte} aoMudar={irA} classe="subnav--voce" itens={[
        { id: 'resumo', rotulo: 'Resumo', oque: 'Os atributos, a cabeça, a semana e o dinheiro' },
        { id: 'saude', rotulo: 'Saúde', oque: 'O prontuário: o que o corpo sinaliza e o que tem nome', conta: sinais.length + condicoes.length },
        { id: 'habilidades', rotulo: 'Habilidades', oque: 'No que você é bom e o seu jeito' },
        { id: 'aparencia', rotulo: 'Aparência', oque: 'O corpo, o rosto, o cabelo, a roupa, os acessórios' },
        ...(i >= 8 ? [{ id: 'gostos' as ParteVoce, rotulo: 'Gostos e cultura', oque: 'O que você ouve e gosta; shows, exposições, obras' }] : []),
        ...(i >= 12 ? [{ id: 'objetivos' as ParteVoce, rotulo: 'Objetivos', oque: 'As metas que você escolheu, o quanto falta e o reconhecimento que veio' }] : []),
        ...(fama.relevante ? [{ id: 'fama' as ParteVoce, rotulo: 'Fama', oque: 'O nome público: por que conhecem você, a imagem, o que a fama traz e cobra' }] : []),
        { id: 'mundo', rotulo: 'No mundo', oque: fama.relevante ? 'Os lugares, o que construiu, a família' : 'O nome público, os lugares, o que construiu, a família' }
      ]} />

      {/* As cinco partes ficam na página (a de fora só não aparece): nada é desmontado ao trocar, nada some. */}
      <div role="tabpanel" id="voce-painel" aria-labelledby={`voce-aba-${parte}`} className={`voce__partes voce__partes--${parte}`}>
      <div className={fora('resumo')}>
      <FichaDeAtributos vida={vida} agir={agir} irPara={irPara} abrirPessoa={abrirPessoa} />
      {parte === 'resumo' && i >= 6 && <Crenca14 vida={vida} agir={agir} />}
      {leituras.length > 0 && (
        <div id="voce-agora" className={`estados estados--${leituras.length}`}>
          {leituras.map(l => <Estado key={l.d} l={l} vida={vida} agir={agir} irPara={irPara} abrirPessoa={abrirPessoa} />)}
        </div>
      )}
      {/* REWORK 9.5 · ROT-01: a cabeça e o corpo vivem a mesma semana — a mesma leitura da rotina de Minha Semana. */}
      {i >= 6 && <ResumoDaRotina vida={vida} irPara={() => irPara('semana')} />}
      {i >= 8 && (
        <section className="voce-dinheiro" aria-label="O dinheiro">
          <button type="button" className="voce-dinheiro__ir" onClick={() => irPara('dinheiro')}>
            <span className="rotulo-pequeno">O dinheiro</span>
            <strong>{leituraDaSeguranca(vida).palavra}</strong>
            <span className="nota">o mês, o que é seu e o que deve — em Vida · Dinheiro →</span>
          </button>
        </section>
      )}
      </div>


      {/* REWORK 7: o que a pessoa SABE FAZER, com os degraus de cada habilidade (a mesma escada da ficha da prática) —
          e, ao lado, os jeitos de nascença que o motor guarda. Antes eram linhas de texto soltas. */}
      {/* REWORK 9.5 · UX-03: uma ficha por habilidade (o nível, a frase, o que mudou no ano e por quê, o histórico) — antes
          eram duas listas das mesmas frentes (os degraus e o "ano a ano"). */}
      <div className={fora('habilidades')}>
      <div id="voce-sabe"><Habilidades vida={vida} irPara={irPara} /></div>

      {tracos.length > 0 && (
        <section className="voce-jeito" aria-labelledby="titulo-jeito">
          <h2 id="titulo-jeito" className="voce-subtitulo">O seu jeito</h2>
          <ul className="voce-jeito__tracos">{tracos.map(t => <li key={t}>{t}</li>)}</ul>
          <p className="voce-tracos">Quem convive diz que você é {tracos.join(', ').replace(/, ([^,]*)$/, ' e $1')} — é o que suas escolhas têm mostrado.</p>
        </section>
      )}
      </div>

      <div className={fora('saude')}>
      {parte === 'saude' && vida.dependencias14 && <Dependencias14 vida={vida} agir={agir} />}
      {!(sinais.length > 0 || condicoes.length > 0) && (
        <div id="voce-saude" className="voce-saude prontuario papel papel--sem-dobra">
          <p className="prontuario__cabeca"><span>Prontuário</span><span>{vida.eu.nome} {vida.eu.sobrenome} · {i} anos</span></p>
          <p className="nota">Nenhum sinal do corpo, nenhuma condição com nome. A saúde de agora, com as causas, está no Resumo (Atributos · Saúde).</p>
        </div>
      )}
      {(sinais.length > 0 || condicoes.length > 0) && (
        <div id="voce-saude" className="voce-saude prontuario papel papel--sem-dobra">
          {/* REWORK 9.6 · VIS-02: a saúde como PRONTUÁRIO — a folha da ficha médica, o que o corpo sinaliza e o que tem nome. */}
          <p className="prontuario__cabeca"><span>Prontuário</span><span>{vida.eu.nome} {vida.eu.sobrenome} · {i} anos</span></p>
          {sinais.length > 0 && (
            <section className="voce-condicoes voce-sinais" aria-label="Sinais do corpo">
              <h2 className="voce-subtitulo">O corpo tem dado sinais</h2>
              <ul>
                {sinais.map(x => <li key={x.id}><strong>{x.texto.charAt(0).toUpperCase() + x.texto.slice(1)}</strong><span>desde {anoDe(x.desde)}</span></li>)}
              </ul>
              <p className="nota">Ainda sem nome. Ir ao médico é o que dá diagnóstico — e tratamento. Ignorar também é escolha: às vezes passa, às vezes o corpo cobra depois.</p>
              <AtendimentoMedico vida={vida} agir={agir} sinais={sinais.length} />
            </section>
          )}
          {condicoes.length > 0 && (
            <section className="voce-condicoes" aria-label="Condições de saúde">
              <h2 className="voce-subtitulo">O que o corpo carrega</h2>
              <ul>
                {condicoes.map(c => (
                  <li key={c.id}>
                    <strong>{c.nome.charAt(0).toUpperCase() + c.nome.slice(1)}</strong>
                    <span>{c.tratando ? 'em tratamento' : vida.processos.some(p => p.tipo === 'tratamento' && p.condicaoId === c.id) ? `na fila ${redeDeSaude(vida).do}` : c.abandono ? 'tratamento parado' : c.cronica ? 'sem tratamento' : 'passando'}{c.cronica ? '' : ' · deve passar'}{c.tarde ? ' · descoberto tarde' : ''}</span>
                  </li>
                ))}
              </ul>
              {/* REWORK 10.6 · P4: parar (com o risco antes) ou retomar — abaixo da lista, uma linha por condição. */}
              {condicoes.map(c => <TratamentoEmCurso key={`tr-${c.id}`} vida={vida} c={c} agir={agir} />)}
            </section>
          )}
        </div>
      )}
      {/* Com sinais, o atendimento mora junto deles (acima); sem sinais, é a entrada de sempre. */}
      {sinais.length === 0 && <AtendimentoMedico vida={vida} agir={agir} sinais={0} />}

      </div>

      <div className={fora('aparencia')} id="voce-aparencia"><AparenciaEEstilo vida={vida} agir={agir} irPara={irPara} /></div>

      {/* 12.4.1: os gostos e a vida cultural saíram de Aparência — não são o visual. */}
      <div className={fora('gostos')} id="voce-gostos">{i >= 8 && <GostosECultura vida={vida} agir={agir} />}</div>

      {/* VIDA 14: os objetivos pessoais (opcionais) e o reconhecimento do meio — sob demanda. */}
      <div className={fora('objetivos')} id="voce-objetivos">{i >= 12 && parte === 'objetivos' && <Objetivos14 vida={vida} agir={agir} />}</div>

      {/* VIDA 13 · Fama: o nome público ganhou parte própria (antes, "O seu nome" dentro de No mundo). */}
      {fama.relevante && <div className={fora('fama')} id="voce-fama"><Fama13 vida={vida} agir={agir} /></div>}

      <div className={fora('mundo')}>
      {fama.relevante && <button type="button" className="fama13-atalho" onClick={() => irA('fama')}>O seu nome público mora em Fama →</button>}
      <div id="voce-mundo"><QuemNoMundo vida={vida} agir={agir} /></div>
      {parte === 'mundo' && <Mundo14 vida={vida} />}
      {i >= 14 && <OQueConstruiu vida={vida} />}
      <Linhagem vida={vida} />
      </div>
      </div>
    </div>
  );
}

/**
 * REWORK 10.5 · SAU-02 — o atendimento médico como entrada própria, sempre no prontuário (nunca escondida): procurar o
 * médico (a criança pede aos responsáveis), onde se é atendido (a rede do país, o plano), e — quando não dá — o porquê
 * escrito. Antes, abaixo dos 12 anos o botão nem existia e, dos 12 aos 13, sumia sem explicação.
 */
function AtendimentoMedico({ vida, agir, sinais }: { vida: Vida; agir: Props['agir']; sinais: number }) {
  const i = idade(vida);
  const rede = redeDeSaude(vida);
  const semTratar = vida.corpo.condicoes.some(c => c.cronica && !c.tratando && c.diagnosticada !== false);
  const pede = sinais > 0 || semTratar;
  const rotulo = i < 14 ? (pede ? 'Contar em casa e pedir para ir ao médico' : 'Pedir aos responsáveis uma consulta') : i < 18 ? (pede ? 'Contar em casa e ir ao médico ver o que é' : 'Ir ao médico (com a família)') : sinais > 0 ? 'Ir ao médico ver o que é' : semTratar ? 'Procurar atendimento médico e tratar' : 'Fazer um check-up';
  return (
    <section className="atendimento-medico" aria-labelledby="titulo-atendimento" data-atendimento={pede ? 'pede' : 'rotina'}>
      <h2 id="titulo-atendimento" className="voce-subtitulo">Atendimento médico</h2>
      <p className="nota">{pede ? (sinais > 0 ? 'O corpo tem dado sinais: o caminho é a consulta, os exames e, se precisar, o tratamento.' : 'Há uma condição sem tratamento: a consulta é o primeiro passo.') : 'Nada pedindo atenção agora. Uma consulta de rotina pega cedo o que o corpo ainda não mostrou.'}</p>
      <div className="grupo-acoes"><BotaoAcao vida={vida} acao={{ tipo: 'cuidar', cuidado: 'consulta' }} agir={agir} variante={pede ? 'principal' : 'secundario'}>{rotulo}</BotaoAcao></div>
      <p className="nota">{i < 18
        ? (rede.sistema === 'seguro' ? 'Quem leva são os adultos da casa: o pediatra do plano (ou a clínica comunitária, para quem não tem). Diagnosticado, o tratamento começa com eles.' : `Quem leva são os adultos da casa: no posto de saúde (${rede.nome}), de graça. Diagnosticado, o tratamento começa com eles.`)
        : vida.financas.planoDeSaude ? 'Pelo plano de saúde: consulta, exames e tratamento sem fila.' : rede.sistema === 'seguro' ? 'Sem plano, a clínica comunitária atende; o tratamento pode custar caro.' : `${rede.o.charAt(0).toUpperCase() + rede.o.slice(1)} atende de graça; o tratamento pode ter fila.`}</p>
    </section>
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
