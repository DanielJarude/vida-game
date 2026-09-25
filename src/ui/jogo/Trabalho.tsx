/**
 * Trabalho: a minha vida profissional AGORA.
 *
 * A tela muda de natureza com o caminho: quem tem carteira vê a estrada, a
 * chefia e o que dá para negociar; o dono vê o movimento, o caixa e a
 * equipe; quem vive de freguesia vê a agenda e o preço; o produtor, a terra
 * e a safra; a atleta, o clube, o contrato e o banco; a sargento, os postos
 * e a guarnição; o servidor, a tabela e a titulação; quem tem mandato, a
 * aprovação, a base e a prioridade. Em todos: poucas ações, as que fazem
 * sentido agora, com o porquê — e um "explorar" para quem quer procurar.
 */

import { useMemo, useRef, useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { disponibilidade } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { anoDe } from '../../motor/tempo';
import { OCUPACOES, ROTULO_SETOR, ROTULO_TRILHA, ocupacao, type Ocupacao } from '../../motor/dados/ocupacoes';
import { familiaDaTrilha } from '../../motor/dados/carreiras';
import { NOME_FORCA, ESPECIALIDADES } from '../../motor/dados/forcas';
import { degrausAcima, elegibilidade, horizonte, nomeOcupacao, porContaPropria, estradaNaArea } from '../../motor/sistemas/trabalho';
import { acoesDoTrabalho, chefiaAtual, leituraDoClima, leituraDoTrabalho, modoDoTrabalho, ritmoDe, rotulosDoRitmo, type AcaoProfissional, type ModoTrabalho } from '../../motor/sistemas/profissao';
import { leituraDoNegocio, negocioAtivo, negociosPossiveis, tetoDoMovimento, tipoDoNegocio } from '../../motor/sistemas/negocio';
import { leituraPolitica, naPolitica } from '../../motor/sistemas/politica';
import { escadaMilitar } from '../../motor/sistemas/militar';
import { editaisAbertos, leituraDoPreparo } from '../../motor/sistemas/concurso';
import { vagasParaVoce } from '../../motor/sistemas/relevancia';
import { O_QUE_TRABALHAR } from '../../motor/sistemas/devolutivas';
import { situacaoNaJustica } from '../../motor/sistemas/justica';
import { leituraDaPausa } from '../../motor/sistemas/pausa';
import { leituraDoEnvolvimento } from '../../motor/sistemas/ilicito';
import { leituraRural } from '../../motor/sistemas/rural';
import { podeTentar } from '../../motor/plausibilidade';
import { AcoesVivas, BotaoAcao, Dado, Folio, Medidor, Secao, Vazio } from '../comum';
import { Retrato } from '../avatar/Retrato';
import { idadePessoa } from '../../motor/nucleo';
import { dinheiroCurto } from '../apresentar';
import { ehPortaDeTrabalho, PortasAbertas } from './Rumo';
import type { Aba } from '../telas/Jogo';

interface Props { vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Aba) => void }

const KICKER: Partial<Record<ModoTrabalho, string>> = {
  negocio: 'o próprio negócio', autonomo: 'por conta própria', informal: 'por conta, na rua', plataforma: 'sem chefe, sem piso', rural: 'a terra', pesca: 'a água',
  artista: 'a obra', atleta: 'o esporte', militar: 'a farda', seguranca: 'a segurança pública', servidor: 'o serviço público', docente: 'a sala de aula', saude: 'o cuidado',
  empregado: 'com carteira', politica: 'a vida pública', formacao: 'a formação', aprendiz: 'o primeiro trabalho', estagio: 'o estágio', procurando: 'a procura',
  aposentado: 'depois do trabalho', pausa: 'cuidando', preso: 'a pena', estudante: 'antes do trabalho', base: 'a base', crianca: 'ainda não'
};

export function Trabalho({ vida, agir, irPara }: Props) {
  const modo = modoDoTrabalho(vida);
  const l = leituraDoTrabalho(vida);
  const [explorar, setExplorar] = useState(modo === 'procurando');
  const explorarRef = useRef<HTMLDivElement>(null);
  const acoes = useMemo(() => acoesDoTrabalho(vida, disponibilidade), [vida]);
  const ir = (d: string) => {
    if (d === 'explorar') { setExplorar(true); setTimeout(() => explorarRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }), 30); return; }
    irPara(d as Aba);
  };
  const e = vida.trabalho.atual;
  const desde = e ? `desde ${anoDe(e.tInicio)}` : '';
  const preso = modo === 'preso';
  const pol = leituraPolitica(vida);
  return (
    <div className={`trabalho trabalho--${modo}`}>
      <Folio kicker={<><span className="folio__area">Trabalho</span> · {KICKER[modo] ?? ''}{desde ? ` · ${desde}` : ''}</>} titulo={modo === 'politica' && pol ? pol.titulo : l.titulo} lede={modo === 'politica' && pol ? pol.etapa : l.frases[0]} />

      {e && modo !== 'politica' && (
        <dl className="ficha-trabalho">
          {l.onde && <Dado rotulo="Onde">{l.onde}</Dado>}
          {l.renda && <Dado rotulo="No bolso">{l.renda.replace(' por mês no bolso', '/mês')}</Dado>}
          {l.jornada && <Dado rotulo="Jornada">{l.jornada}</Dado>}
          {l.vinculo && <Dado rotulo="Vínculo">{l.vinculo}</Dado>}
        </dl>
      )}
      {l.frases.length > 1 && modo !== 'politica' && <div className="como-vai">{l.frases.slice(1).map((f, k) => <p key={k}>{f}</p>)}</div>}

      {preso && <SituacaoDaPena vida={vida} />}
      {modo === 'pausa' && <p className="nota-grande">{leituraDaPausa(vida)}</p>}
      {modo === 'negocio' && <PainelNegocio vida={vida} />}
      {(modo === 'autonomo' || modo === 'informal' || modo === 'plataforma' || modo === 'artista') && <PainelFreguesia vida={vida} />}
      {(modo === 'rural' || modo === 'pesca') && <PainelCampo vida={vida} />}
      {modo === 'atleta' && <PainelAtleta vida={vida} />}
      {modo === 'militar' && <PainelFarda vida={vida} />}
      {(modo === 'servidor' || modo === 'docente') && <PainelCarreiraPublica vida={vida} />}
      {(modo === 'empregado' || modo === 'saude' || modo === 'seguranca' || modo === 'aprendiz' || modo === 'estagio' || modo === 'formacao') && <PainelEstrada vida={vida} />}
      {pol && naPolitica(vida) && <PainelPolitico vida={vida} principal={modo === 'politica'} />}
      <PorFora vida={vida} agir={agir} />

      {!preso && <PortasAbertas vida={vida} agir={agir} filtro={ehPortaDeTrabalho} titulo="Portas de trabalho" />}

      {acoes.agora.length > 0 && (
        <section className="agora-trabalho" aria-labelledby="agora-trabalho">
          <h2 id="agora-trabalho" className="secao-fio">Agora</h2>
          <AcoesVivas acoes={acoes.agora as AcaoProfissional[]} agir={agir} ir={ir} rotulo="O que dá para fazer agora" />
        </section>
      )}
      {(acoes.mais.length > 0 || acoes.saidas.length > 0) && <Mais mais={acoes.mais} saidas={acoes.saidas} agir={agir} ir={ir} />}
      {modo === 'crianca' && <Vazio>Trabalho é proibido antes dos 14. O trabalho agora é crescer.</Vazio>}

      {!preso && modo !== 'crianca' && (
        <div ref={explorarRef} id="explorar">
          <Explorar vida={vida} agir={agir} aberto={explorar} alternar={() => setExplorar(x => !x)} />
        </div>
      )}
      <Devolutivas vida={vida} />
      {(vida.trabalho.historico.length > 0 || vida.caminhos.marcas.length > 0) && <PorOndePassou vida={vida} />}
    </div>
  );
}

/* ================================================================ Painéis */

function Mais({ mais, saidas, agir, ir }: { mais: AcaoProfissional[]; saidas: AcaoProfissional[]; agir: (a: Acao) => boolean; ir: (d: string) => void }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="mais-trabalho">
      <button type="button" className="dobra__botao" aria-expanded={aberto} onClick={() => setAberto(x => !x)}>{aberto ? 'Recolher' : `Outras possibilidades (${mais.length + saidas.length})`}</button>
      {aberto && (
        <>
          <AcoesVivas acoes={mais} agir={agir} ir={ir} rotulo="Outras possibilidades" />
          {saidas.length > 0 && <div className="saidas"><p className="saidas__titulo">Saídas</p><AcoesVivas acoes={saidas} agir={agir} ir={ir} rotulo="Saídas" /></div>}
        </>
      )}
    </div>
  );
}

/** O negócio: movimento contra o que a casa comporta, o caixa, a equipe (gente), o nome. */
function PainelNegocio({ vida }: { vida: Vida }) {
  const n = negocioAtivo(vida)!;
  const t = tipoDoNegocio(n);
  const l = leituraDoNegocio(vida, n);
  const teto = tetoDoMovimento(n);
  const porte = n.emCasa ? 'pequeno, em casa' : n.porte === 3 ? 'grande' : n.porte === 2 ? 'ampliado' : 'um ponto pequeno';
  const jeito = ({ bairro: 'freguesia do bairro', qualidade: 'aposta na qualidade', preco: 'preço baixo', online: 'também pela internet' } as const)[n.estrategia ?? 'bairro'];
  return (
    <section className="painel painel--negocio" aria-label="O negócio">
      <p className="painel__frase">{l.movimento}</p>
      <Medidor valor={n.clientela} limite={teto} rotulo="Movimento" palavra={n.clientela < 20 ? 'fraco' : n.clientela < 45 ? 'crescendo' : n.clientela < 70 ? 'bom' : 'casa cheia'} />
      <dl className="dados">
        <Dado rotulo="O último ano">{l.caixa}</Dado>
        <Dado rotulo="No caixa">{dinheiroCurto(n.caixa ?? 0)}<small> (do negócio, não seu)</small></Dado>
        <Dado rotulo="O nome">{l.reputacao}</Dado>
        <Dado rotulo="Tamanho">{porte}{(n.unidades ?? 1) > 1 ? ` · ${n.unidades} unidades` : ''}</Dado>
        <Dado rotulo="O jeito de vender">{jeito}</Dado>
        {n.socioId && vida.pessoas[n.socioId] && <Dado rotulo="Sócio">{vida.pessoas[n.socioId].nome}, metade de tudo</Dado>}
      </dl>
      <div className="equipe">
        <p className="equipe__titulo">{l.gente}</p>
        {(n.equipe ?? []).length > 0 && (
          <ul className="equipe__rostos">
            {n.equipe!.map(f => { const p = vida.pessoas[f.pessoaId]; return p ? <li key={p.id}><Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.id} tamanho={40} rotulo={p.nome} /><span>{p.nome}<small>{f.funcao}</small></span></li> : null; })}
          </ul>
        )}
      </div>
      {t && n.semEstrada && (vida.t - n.tInicio) / 12 < 3 && <p className="nota">Você abriu sem conhecer o ramo: os primeiros anos pesam mais.</p>}
    </section>
  );
}

/** Freguesia: quem vive de cliente vê a agenda, o preço, o que investiu. */
function PainelFreguesia({ vida }: { vida: Vida }) {
  const e = vida.trabalho.atual!;
  const c = e.clientela ?? 0;
  const f = familiaDaTrilha(ocupacao(e.ocupacaoId).trilha);
  const arte = f.progressao === 'arte';
  const p = vida.caminhos.arte;
  return (
    <section className="painel painel--freguesia" aria-label="A freguesia">
      <p className="painel__frase">{horizonte(vida)}</p>
      <Medidor valor={c} rotulo={arte ? 'Trabalhos' : 'Freguesia'} palavra={c < 20 ? 'pouca' : c < 45 ? 'crescendo' : c < 70 ? 'fiel' : 'agenda cheia'} />
      <dl className="dados">
        <Dado rotulo="Preço">{e.preco === 'alto' ? 'acima do mercado' : e.preco === 'baixo' ? 'abaixo do mercado' : 'o de mercado'}</Dado>
        <Dado rotulo="Ritmo">{ritmoDe(e) === 'puxado' ? rotulosDoRitmo(vida).puxado.toLowerCase() : ritmoDe(e) === 'leve' ? rotulosDoRitmo(vida).leve.toLowerCase() : 'o de sempre'}</Dado>
        <Dado rotulo="Estrutura">{(e.estrutura ?? 0) === 0 ? 'o básico' : e.estrutura === 1 ? 'equipamento próprio' : 'espaço próprio'}</Dado>
        <Dado rotulo="Formalização">{e.mei ? 'MEI: nota fiscal e INSS' : e.contrato === 'informal' ? 'informal: sem CNPJ, sem INSS' : 'por conta própria'}</Dado>
        {p?.ativo && <Dado rotulo={p.tipo === 'banda' ? 'A banda' : 'O grupo'}>{p.nome}: {p.publico < 15 ? 'quase ninguém conhece ainda' : p.publico < 40 ? 'já tem quem vá ver' : p.publico < 65 ? 'público fiel na cidade' : 'gente de fora já conhece'}</Dado>}
      </dl>
      <p className="nota">{estradaNaArea(vida)}</p>
    </section>
  );
}

function PainelCampo({ vida }: { vida: Vida }) {
  const ru = vida.caminhos.rural;
  const e = vida.trabalho.atual!;
  return (
    <section className="painel painel--campo" aria-label="A terra">
      <p className="painel__frase">{leituraRural(vida) ?? horizonte(vida)}</p>
      <Medidor valor={e.clientela ?? 0} rotulo="Produção" palavra={(e.clientela ?? 0) < 20 ? 'mal paga os custos' : (e.clientela ?? 0) < 45 ? 'crescendo' : (e.clientela ?? 0) < 70 ? 'com comprador certo' : 'disputada'} />
      {ru && (
        <dl className="dados">
          <Dado rotulo="A terra">{ru.terra === 'familia' ? 'da família' : ru.terra === 'arrendada' ? 'arrendada (paga todo ano)' : 'própria'}</Dado>
          <Dado rotulo="A última safra">{ru.ultimaSafra === 'boa' ? 'boa' : ru.ultimaSafra === 'ruim' ? `ruim${ru.anosRuins >= 2 ? `, ${ru.anosRuins} anos seguidos` : ''}` : ru.ultimaSafra ? 'normal' : 'ainda nenhuma'}</Dado>
          <Dado rotulo="Cooperativa">{ru.cooperativa ? 'cooperado' : 'vende sozinho'}</Dado>
          <Dado rotulo="Investimento">{(e.estrutura ?? 0) === 0 ? 'o que veio com a terra' : 'equipamento financiado'}</Dado>
        </dl>
      )}
    </section>
  );
}

function PainelAtleta({ vida }: { vida: Vida }) {
  const es = vida.caminhos.esporte!;
  const e = vida.trabalho.atual!;
  const i = idade(vida);
  const limite = es.modalidade === 'futebol' ? 33 : 31;
  return (
    <section className="painel painel--atleta" aria-label="A carreira no esporte">
      <div className="placar">
        <span className={`placar__espaco placar__espaco--${es.espaco ?? 'reserva'}`}>{es.espaco === 'titular' ? 'Titular' : 'Reserva'}</span>
        <span className="placar__clube">{e.empregador}</span>
      </div>
      <dl className="dados">
        <Dado rotulo="Contrato">{es.contratoAte ? `até ${anoDe(es.contratoAte)}` : '—'}</Dado>
        <Dado rotulo="Treino">{es.foco === 'forcar' ? 'dobrado (evolui e machuca mais)' : es.foco === 'preservar' ? 'poupando o corpo' : 'o normal do clube'}</Dado>
        <Dado rotulo="O corpo">{es.lesoes === 0 ? 'sem lesões sérias' : `${es.lesoes} ${es.lesoes === 1 ? 'lesão' : 'lesões'} na carreira`}</Dado>
        <Dado rotulo="O prazo">{i < limite - 6 ? 'o auge está pela frente' : i < limite - 2 ? 'o auge é agora' : 'o fim se aproxima'}</Dado>
      </dl>
      <p className="nota">Quase ninguém joga profissionalmente depois dos 35. Quem se prepara ainda jogando tem para onde ir.</p>
    </section>
  );
}

function PainelFarda({ vida }: { vida: Vida }) {
  const m = vida.caminhos.militar;
  const postos = escadaMilitar(vida);
  return (
    <section className="painel painel--farda" aria-label="A carreira militar">
      {postos.length >= 2 && (
        <ol className="escada escada--farda">
          {[...postos].reverse().map(x => (
            <li key={x.nome} className={`escada__degrau escada__degrau--${x.estado === 'agora' ? 'agora' : x.estado === 'foi' ? 'foi' : 'acima'}`} aria-current={x.estado === 'agora' ? 'step' : undefined}>
              <span className="escada__nome">{x.nome}</span>
              <span className="escada__nota">{x.estado === 'agora' ? 'você está aqui' : x.estado === 'foi' ? 'já foi' : ''}</span>
            </li>
          ))}
        </ol>
      )}
      {m && (
        <dl className="dados">
          <Dado rotulo="Força">{NOME_FORCA[m.forca].replace(/^(o|a) /, '')}</Dado>
          <Dado rotulo="Guarnição">{vida.moradia.municipioId === m.guarnicao ? 'na cidade onde mora' : 'longe de casa'}{m.transferencias ? ` · ${m.transferencias} ${m.transferencias === 1 ? 'transferência' : 'transferências'}` : ''}</Dado>
          {m.especialidade && <Dado rotulo="Especialidade">{ESPECIALIDADES[m.especialidade]?.nome ?? m.especialidade}</Dado>}
          <Dado rotulo="Tempo de serviço">{Math.floor((vida.t - m.tIngresso) / 12)} anos</Dado>
          <Dado rotulo="Teste físico">{m.tafFalhou !== undefined && vida.t - m.tafFalhou <= 12 ? 'não passou no último' : 'em dia'}</Dado>
        </dl>
      )}
      <p className="painel__frase">{horizonte(vida)}</p>
    </section>
  );
}

function PainelCarreiraPublica({ vida }: { vida: Vida }) {
  const e = vida.trabalho.atual!;
  const anos = Math.floor((vida.t - e.tInicio) / 12);
  const pos = vida.educacao.concluidos.filter(c => ['pos', 'mestrado', 'doutorado'].includes(c.nivel)).map(c => c.nivel === 'pos' ? 'especialização' : c.nivel);
  const docente = modoDoTrabalho(vida) === 'docente';
  const servidor = e.contrato === 'servidor';
  const proxima = servidor ? anoDe(e.tInicio) + Math.ceil((anos + 0.01) / 3) * 3 : undefined;
  return (
    <section className={`painel painel--${docente ? 'docente' : 'publico'}`} aria-label={docente ? 'A sala de aula' : 'A carreira pública'}>
      <p className="painel__frase">{horizonte(vida)}</p>
      <dl className="dados">
        {servidor && <Dado rotulo="Estabilidade">{anos < 3 ? `estágio probatório até ${anoDe(e.tInicio) + 3}` : 'estável'}</Dado>}
        {proxima && <Dado rotulo="Próxima progressão">{proxima}</Dado>}
        <Dado rotulo="Titulação">{pos.length ? pos.join(', ') : 'graduação'}</Dado>
        {docente && <Dado rotulo="Turmas">{ritmoDe(e) === 'puxado' ? 'carga a mais' : ritmoDe(e) === 'leve' ? 'carga reduzida' : 'a carga de sempre'}</Dado>}
      </dl>
      <Clima vida={vida} />
    </section>
  );
}

/** Quem tem carteira: a estrada (os degraus), a chefia, o horizonte. */
function PainelEstrada({ vida }: { vida: Vida }) {
  const e = vida.trabalho.atual!;
  const oc = ocupacao(e.ocupacaoId);
  const degraus = [...new Map(OCUPACOES.filter(x => x.trilha === oc.trilha && !x.concurso && x.contrato !== 'estagio' && !x.entrada && (x.nivel <= oc.nivel || degrausAcima(oc).some(d => d.id === x.id) || x.nivel === oc.nivel + 2)).sort((a, b) => a.nivel - b.nivel).map(x => [x.nivel, x] as const)).values()];
  const jaFoi = new Set(vida.trabalho.historico.map(h => h.ocupacaoId));
  return (
    <section className="painel painel--estrada" aria-label={`A estrada em ${ROTULO_TRILHA[oc.trilha] ?? oc.trilha}`}>
      {degraus.length >= 2 && (
        <ol className="escada">
          {[...degraus].reverse().map(x => {
            const estado = x.id === oc.id ? 'agora' : x.nivel < oc.nivel ? (jaFoi.has(x.id) ? 'foi' : 'abaixo') : 'acima';
            return (
              <li key={x.id} className={`escada__degrau escada__degrau--${estado}`} aria-current={estado === 'agora' ? 'step' : undefined}>
                <span className="escada__nome">{nomeOcupacao(vida, x)}</span>
                <span className="escada__nota">{estado === 'agora' ? 'você está aqui' : estado === 'foi' ? 'já foi' : estado === 'acima' ? (x.nivel === oc.nivel + 1 ? 'o próximo passo' : 'mais adiante') : ''}</span>
              </li>
            );
          })}
        </ol>
      )}
      <p className="painel__frase">{horizonte(vida)}</p>
      <p className="nota">{estradaNaArea(vida)}</p>
      <Clima vida={vida} />
    </section>
  );
}

function Clima({ vida }: { vida: Vida }) {
  const c = leituraDoClima(vida);
  if (!c) return null;
  const chefe = chefiaAtual(vida);
  return (
    <p className={`clima clima--${c.tom}`}>
      {chefe && <Retrato visual={chefe.visual} genero={chefe.genero} idade={idadePessoa(vida, chefe)} semente={chefe.id} tamanho={28} rotulo={chefe.nome} />}
      <span><span className="clima__rotulo">Clima: {c.palavra}.</span> {c.texto}</span>
    </p>
  );
}

function PainelPolitico({ vida, principal }: { vida: Vida; principal: boolean }) {
  const l = leituraPolitica(vida)!;
  const m = vida.caminhos.politica?.mandato;
  return (
    <section className={`painel painel--politica${principal ? ' painel--principal' : ''}`} aria-label="A vida política">
      {!principal && <h2 className="secao-fio secao-fio--politica">A vida política · {l.titulo}</h2>}
      {m && <Medidor valor={m.aprovacao} rotulo="Aprovação" palavra={l.aprovacao ?? ''} />}
      <dl className="dados">
        {l.partido && <Dado rotulo="Partido">{l.partido}</Dado>}
        <Dado rotulo="Base de apoio">{l.apoio}</Dado>
        <Dado rotulo="O nome">{l.reputacao}</Dado>
        {l.prioridade && <Dado rotulo={m ? 'Prioridade do mandato' : 'Bandeira'}>{l.prioridade}</Dado>}
      </dl>
      {l.horizonte && <p className="painel__frase">{l.horizonte}</p>}
      {l.historico.length > 0 && <ul className="historico-politico">{l.historico.map((h, k) => <li key={k}>{h}</li>)}</ul>}
    </section>
  );
}

function SituacaoDaPena({ vida }: { vida: Vida }) {
  const t = situacaoNaJustica(vida);
  return t ? <section className="painel painel--pena" aria-label="A pena"><p className="painel__frase">{t}</p></section> : null;
}

/** O que se faz "por fora": outra moldura, outro tom — nunca confundido com trabalho. */
function PorFora({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const t = leituraDoEnvolvimento(vida);
  if (!t) return null;
  return (
    <section className="por-fora" aria-label="Por fora">
      <p className="por-fora__titulo">Por fora</p>
      <p>{t}</p>
      <BotaoAcao vida={vida} acao={{ tipo: 'parar_por_fora' }} agir={agir} variante="secundario" ocultarBloqueado>Largar isso de vez</BotaoAcao>
    </section>
  );
}

/* ================================================================ Explorar */

function Explorar({ vida, agir, aberto, alternar }: { vida: Vida; agir: (a: Acao) => boolean; aberto: boolean; alternar: () => void }) {
  return (
    <section className="explorar-trabalho" aria-labelledby="titulo-explorar">
      <button type="button" id="titulo-explorar" className="explorar-trabalho__titulo" aria-expanded={aberto} onClick={alternar}>
        <span>Explorar</span><span className="explorar-trabalho__sub">vagas, concursos, o próprio negócio</span>
      </button>
      {aberto && (
        <div className="explorar-trabalho__corpo">
          <Vagas vida={vida} agir={agir} />
          {idade(vida) >= 17 && !vida.justica?.prisao && <Concursos vida={vida} agir={agir} />}
          {idade(vida) >= 18 && <Negocios vida={vida} agir={agir} />}
        </div>
      )}
    </section>
  );
}

function Vagas({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [resto, setResto] = useState(false);
  const [bloq, setBloq] = useState(false);
  const atual = vida.trabalho.atual?.ocupacaoId;
  const { para, resto: outras } = vagasParaVoce(vida);
  const areas = new Set(vida.educacao.concluidos.map(c => c.area));
  const minhaArea = (oc: Ocupacao) => (vida.trabalho.experiencia[oc.trilha] ?? 0) >= 12 || !!oc.area?.some(a => areas.has(a)) || !!oc.habilidade;
  const perto = new Set<string>();
  if (atual) for (const x of degrausAcima(ocupacao(atual))) perto.add(x.id);
  const todas = OCUPACOES.filter(oc => !oc.concurso && oc.id !== atual && oc.entrada !== 'eleicao');
  for (const oc of todas) if (minhaArea(oc) && oc.nivel >= 2) perto.add(oc.id);
  const fora = todas.map(oc => ({ oc, d: elegibilidade(vida, oc) })).filter(x => !podeTentar(x.d) && x.d.grau !== 'ilegal' && x.d.grau !== 'impossivel' && perto.has(x.oc.id) && !/currículo|oportunidade|peneira|carreira militar|negócio|eleição/.test(x.d.motivo ?? '')).slice(0, 8);
  const usadas = vida.anoAtual.acoes.filter(a => a.startsWith('candidatura:')).length;
  const porSetor = [...new Set(outras.map(x => x.oc.setor))].map(setor => ({ setor, lista: outras.filter(x => x.oc.setor === setor).sort((a, b) => a.oc.nivel - b.oc.nivel || b.oc.salario - a.oc.salario) }));
  const linha = ({ oc }: { oc: Ocupacao }, motivo?: string) => (
    <li key={oc.id} className="vaga">
      <div className="vaga__texto"><strong>{nomeOcupacao(vida, oc)}</strong>{motivo && <span className="vaga__motivo">{motivo}</span>}<span>{ROTULO_SETOR[oc.setor]}{oc.experiencia ? ' · pede estrada' : oc.nivel <= 1 ? ' · para começar' : ''} · a partir de {dinheiroCurto(oc.salario)}{oc.jornada === 'fora' ? ' · dias fora de casa' : oc.jornada === 'longa' ? ' · jornada longa' : ''}</span></div>
      <BotaoAcao vida={vida} acao={{ tipo: 'candidatar', ocupacaoId: oc.id }} agir={agir} mostrarChance={!porContaPropria(oc)}>{porContaPropria(oc) ? 'Começar por conta' : 'Candidatar-se'}</BotaoAcao>
    </li>
  );
  if (idade(vida) < 14) return null;
  return (
    <div className="explorar-bloco">
      <h3 className="explorar-bloco__titulo">{vida.trabalho.atual ? 'Outras vagas' : 'Vagas que cabem em você'}</h3>
      <p className="dica">Candidatar-se leva a uma entrevista de duas ou três perguntas. Até três processos por ano ({Math.max(0, 3 - usadas)} restantes). Por conta própria não há entrevista: a freguesia é que decide.</p>
      {para.length === 0 && outras.length === 0 && <Vazio>Nenhuma vaga ao seu alcance agora.</Vazio>}
      {para.length > 0 && <ul className="lista-vagas lista-vagas--sugestoes">{para.map(x => linha(x.item, x.motivo))}</ul>}
      {outras.length > 0 && (
        <div className="explorar">
          <button type="button" className="botao botao--discreto" aria-expanded={resto} onClick={() => setResto(x => !x)}>{resto ? 'Recolher' : `Todas as outras vagas, por área (${outras.length})`}</button>
          {resto && porSetor.map(g => (
            <div key={g.setor} className="grupo-atividades">
              <h4 className="grupo-atividades__titulo">{ROTULO_SETOR[g.setor]}</h4>
              <ul className="lista-vagas">{g.lista.map(x => linha(x))}</ul>
            </div>
          ))}
        </div>
      )}
      {fora.length > 0 && (
        <div className="explorar">
          <button type="button" className="botao botao--discreto" aria-expanded={bloq} onClick={() => setBloq(x => !x)}>{bloq ? 'Esconder' : 'Ver'} o próximo passo e o que falta ({fora.length})</button>
          {bloq && <ul className="lista-vagas lista-vagas--bloqueadas">{fora.map(({ oc, d }) => <li key={oc.id} className="vaga vaga--bloqueada"><div className="vaga__texto"><strong>{nomeOcupacao(vida, oc)}</strong><span>{d.motivo}</span></div></li>)}</ul>}
        </div>
      )}
    </div>
  );
}

function Concursos({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const editais = editaisAbertos(vida).map(oc => ({ oc, d: elegibilidade(vida, oc) })).filter(x => podeTentar(x.d));
  const estudando = vida.rotinas.some(r => r.id === 'estudar_concurso');
  if (!editais.length && !estudando && vida.caminhos.concurso.tentativas === 0) return null;
  return (
    <div className="explorar-bloco">
      <h3 className="explorar-bloco__titulo">Concursos</h3>
      <p className="dica">{estudando ? `Você estuda para concurso${vida.caminhos.concurso.meses >= 12 ? ` — o equivalente a ${Math.round(vida.caminhos.concurso.meses / 12)} ${Math.round(vida.caminhos.concurso.meses / 12) === 1 ? 'ano' : 'anos'} de estudo firme` : ''}.` : 'Concurso pede preparo: sem estudo, é quase loteria. O estudo entra em Tempo livre.'}</p>
      {editais.length === 0 && <Vazio>Nenhum edital aberto que caiba no seu perfil este ano.</Vazio>}
      <ul className="lista-vagas">
        {editais.map(({ oc }) => (
          <li key={oc.id} className="vaga">
            <div className="vaga__texto"><strong>{nomeOcupacao(vida, oc)}</strong><span>{leituraDoPreparo(vida, oc)}</span></div>
            <BotaoAcao vida={vida} acao={{ tipo: 'candidatar', ocupacaoId: oc.id }} agir={agir} mostrarChance>Inscrever-se</BotaoAcao>
          </li>
        ))}
      </ul>
      {vida.trabalho.candidaturas.length > 0 && <p className="nota">Concurso em andamento: {vida.trabalho.candidaturas.map(c => nomeOcupacao(vida, ocupacao(c.ocupacaoId))).join(', ')} — resultado no próximo ano.</p>}
    </div>
  );
}

function Negocios({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const lista = negociosPossiveis(vida).filter(n => podeTentar(n.veredito) || /R\$/.test(n.veredito.motivo ?? ''));
  if (!lista.length || negocioAtivo(vida)) return null;
  return (
    <div className="explorar-bloco">
      <h3 className="explorar-bloco__titulo">O próprio negócio</h3>
      <p className="dica">Abrir é um processo: com o dinheiro guardado, pequeno e em casa, com empréstimo ou com um sócio. O negócio tem caixa próprio; crescer custa.</p>
      <ul className="lista-vagas">
        {lista.map(n => (
          <li key={n.t.id} className="vaga">
            <div className="vaga__texto"><strong>Abrir {n.t.nome}</strong><span>uns {dinheiroCurto(n.custo)} para começar{n.t.emCasa ? ` (ou uns ${dinheiroCurto(n.custo * 0.4)} começando em casa)` : ''}</span></div>
            <BotaoAcao vida={vida} acao={{ tipo: 'abrir_negocio', negocio: n.t.id }} agir={agir}>Pensar em abrir</BotaoAcao>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================ Trajetória */

function Devolutivas({ vida }: { vida: Vida }) {
  const lista = vida.caminhos.devolutivas.filter(d => !d.passou && vida.t - d.t <= 36).slice(-3).reverse();
  if (!lista.length) return null;
  return (
    <Secao titulo="O que ficou das últimas tentativas">
      <ul className="devolutivas">
        {lista.map((d, k) => (
          <li key={k} className="devolutiva">
            <span className="devolutiva__ano">{anoDe(d.t)}</span>
            <div>
              <strong>{d.titulo}</strong>
              <p>{d.texto}{d.perto ? ' Ficou perto.' : ''}</p>
              {d.falta && <p className="devolutiva__dica">{O_QUE_TRABALHAR[d.falta]}</p>}
            </div>
          </li>
        ))}
      </ul>
    </Secao>
  );
}

function PorOndePassou({ vida }: { vida: Vida }) {
  const t = vida.trabalho;
  const trilhas = Object.entries(t.experiencia).filter(([, m]) => m >= 12).sort((a, b) => b[1] - a[1]);
  const marcos = vida.caminhos.marcas.filter(m => m.peso === 3).slice(-8);
  return (
    <Secao titulo="Por onde você passou" recolhivel aberta={false}>
      {marcos.length > 0 && <ul className="marcos-caminho">{marcos.map((m, k) => <li key={k}><span className="marcos-caminho__ano">{anoDe(m.t)}</span><span>{m.texto}</span></li>)}</ul>}
      {t.historico.slice().reverse().slice(0, 12).map((h, k) => <div key={k} className="linha"><span className="linha__rotulo">{anoDe(h.tInicio)}–{anoDe(h.tFim)}</span><span className="linha__valor">{nomeOcupacao(vida, ocupacao(h.ocupacaoId))}, {h.empregador}</span></div>)}
      {trilhas.length > 0 && <p className="nota">Estrada: {trilhas.map(([tr, m]) => `${Math.floor(m / 12)} ${Math.floor(m / 12) === 1 ? 'ano' : 'anos'} em ${ROTULO_TRILHA[tr] ?? tr}`).join(' · ')}.</p>}
      <p className="nota">INSS: {Math.floor(t.contribuicao / 12)} anos de contribuição.{t.licencas.length ? ` Registros: ${t.licencas.map(l => l.toUpperCase()).join(', ')}.` : ''}</p>
    </Secao>
  );
}
