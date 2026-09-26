/**
 * Trabalho: a vida profissional, em três camadas que não se misturam.
 *
 *   1. AGORA — a situação profissional de hoje: o que se faz, onde, quanto
 *      entra, como vai, e o que dá para fazer nela (poucas ações, com o
 *      porquê). O painel muda de natureza com o caminho: a estrada e a
 *      chefia de quem tem carteira; o movimento, o caixa e a equipe do dono;
 *      a agenda e o preço de quem vive de freguesia; a terra; o clube e o
 *      contrato; a farda e o que pode vir; o mandato.
 *   2. EM PARALELO — o que corre ao lado: o negócio tocado nas horas vagas,
 *      a base do clube, a vida política quando não é o trabalho principal,
 *      a banda, o bico, o estudo para concurso.
 *   3. OUTRAS POSSIBILIDADES — procurar: vagas (todas, organizadas por
 *      família, com busca e filtros), concursos, abrir um negócio, a porta
 *      da vida política. Cada coisa diz, antes, com o que ela conflitaria.
 */

import { useMemo, useRef, useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { disponibilidade } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { anoDe } from '../../motor/tempo';
import { OCUPACOES, ROTULO_SETOR, ROTULO_TRILHA, ocupacao, type Ocupacao } from '../../motor/dados/ocupacoes';
import { familiaDaTrilha } from '../../motor/dados/carreiras';
import { ESPECIALIDADES } from '../../motor/dados/forcas';
import { degrausAcima, elegibilidade, horizonte, nomeOcupacao, porContaPropria, estradaNaArea } from '../../motor/sistemas/trabalho';
import { acoesDoTrabalho, chefiaAtual, leituraDoClima, leituraDoTrabalho, modoDoTrabalho, ritmoDe, rotulosDoRitmo, type AcaoProfissional, type ModoTrabalho } from '../../motor/sistemas/profissao';
import { acoesDoNegocio } from '../../motor/sistemas/gestao';
import { contaDoAno, dedicacaoDe, donoIntegral, estrategiaDe, leituraDoNegocio, negocioAberto, negociosPossiveis, parteDoSocio, presencaDe, tetoDoMovimento, tipoDoNegocio } from '../../motor/sistemas/negocio';
import { rotuloEstrategia } from '../../motor/dados/negocios';
import { leituraPolitica, naPolitica, nomeDaBandeira, portasDaPolitica } from '../../motor/sistemas/politica';
import { escadaMilitar, perspectivasMilitares } from '../../motor/sistemas/militar';
import { editaisAbertos, leituraDoPreparo } from '../../motor/sistemas/concurso';
import { vagasParaVoce } from '../../motor/sistemas/relevancia';
import { O_QUE_TRABALHAR } from '../../motor/sistemas/devolutivas';
import { situacaoNaJustica } from '../../motor/sistemas/justica';
import { leituraDaPausa } from '../../motor/sistemas/pausa';
import { leituraDoEnvolvimento } from '../../motor/sistemas/ilicito';
import { leituraRural } from '../../motor/sistemas/rural';
import { analisarEntrada } from '../../motor/sistemas/compromissos';
import { modeloRotina } from '../../motor/sistemas/rotinas';
import { DIVISAO_DO_NIVEL, doClube } from '../../motor/dados/clubes';
import { podeTentar } from '../../motor/plausibilidade';
import { AcoesVivas, BotaoAcao, Dado, Escolha, Folio, Medidor, Secao } from '../comum';
import { Retrato } from '../avatar/Retrato';
import { idadePessoa } from '../../motor/nucleo';
import { dinheiroCurto } from '../apresentar';
import { ehPortaDeTrabalho, PortasAbertas } from './Estudos';
import { Catalogo, type ItemCatalogo } from './Catalogo';
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

      <section className="camada camada--agora" aria-labelledby="camada-agora">
        <h2 id="camada-agora" className="camada__titulo">A sua situação agora</h2>
        {(e || modo === 'negocio') && modo !== 'politica' && (
          <dl className="ficha-trabalho">
            {l.onde && !/^Por conta própria$|^A internet$|^Por encomenda$/i.test(l.onde) && <Dado rotulo="Onde">{l.onde}</Dado>}
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
        {modo === 'base' && <PainelBase vida={vida} />}
        {modo === 'militar' && <PainelFarda vida={vida} />}
        {(modo === 'servidor' || modo === 'docente') && <PainelCarreiraPublica vida={vida} />}
        {(modo === 'empregado' || modo === 'saude' || modo === 'seguranca' || modo === 'aprendiz' || modo === 'estagio' || modo === 'formacao') && <PainelEstrada vida={vida} />}
        {pol && modo === 'politica' && <PainelPolitico vida={vida} principal />}

        {acoes.agora.length > 0 && <AcoesVivas acoes={acoes.agora as AcaoProfissional[]} agir={agir} ir={ir} rotulo="O que dá para fazer agora" />}
        {(acoes.mais.length > 0 || acoes.saidas.length > 0) && <Mais mais={acoes.mais} saidas={acoes.saidas} agir={agir} ir={ir} />}
        {modo === 'crianca' && <p className="vazio">Trabalho é proibido antes dos 14. O trabalho agora é crescer.</p>}
      </section>

      <EmParalelo vida={vida} agir={agir} irPara={irPara} modo={modo} />

      {!preso && <PortasAbertas vida={vida} agir={agir} filtro={ehPortaDeTrabalho} titulo="Portas de trabalho" />}

      {!preso && modo !== 'crianca' && (
        <div ref={explorarRef} id="explorar">
          <OutrasPossibilidades vida={vida} agir={agir} aberto={explorar} alternar={() => setExplorar(x => !x)} irPara={irPara} />
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
      <button type="button" className="dobra__botao" aria-expanded={aberto} onClick={() => setAberto(x => !x)}>{aberto ? 'Recolher' : `Mais ações (${mais.length + saidas.length})`}</button>
      {aberto && (
        <>
          <AcoesVivas acoes={mais} agir={agir} ir={ir} rotulo="Outras possibilidades" />
          {saidas.length > 0 && <div className="saidas"><p className="saidas__titulo">Saídas</p><AcoesVivas acoes={saidas} agir={agir} ir={ir} rotulo="Saídas" /></div>}
        </>
      )}
    </div>
  );
}

const NOMES_MELHORIA: Record<string, string> = { estrutura1: 'estrutura melhorada', estrutura2: 'estrutura de primeira', especialidade: 'uma especialidade própria', delivery: 'aplicativos de entrega', agenda: 'agenda on-line', logistica: 'entrega bem feita', fornecedor: 'fornecedor melhor', treino: 'equipe treinada', gestao: 'gestão profissional' };

/** O negócio: movimento contra o que ele comporta, o caixa, a equipe (gente), o nome — no idioma de cada ofício. */
function PainelNegocio({ vida }: { vida: Vida }) {
  const n = negocioAberto(vida)!;
  const t = tipoDoNegocio(n);
  const l = leituraDoNegocio(vida, n);
  const teto = tetoDoMovimento(n, vida);
  const p = presencaDe(n);
  const porte = n.emCasa ? 'pequeno, em casa' : n.porte === 3 ? 'grande' : n.porte === 2 ? 'ampliado' : p === 'online' ? 'uma operação pequena' : p === 'atendimento' ? 'uma sala' : p === 'obra' ? 'uma equipe pequena' : 'um ponto pequeno';
  const jeito = rotuloEstrategia(p, estrategiaDe(n), n.tipo)?.hoje ?? 'o de sempre';
  const melhorias = (n.melhorias ?? []).filter(m => m !== 'fornecedor_ruim');
  return (
    <section className="painel painel--negocio" aria-label="O negócio">
      <p className="painel__frase">{l.movimento}</p>
      <Medidor valor={n.clientela} limite={teto} rotulo={l.medidor} palavra={l.palavra} />
      <ContaDoNegocioAno vida={vida} />
      <dl className="dados">
        <Dado rotulo="Como é tocado">{l.dedicacao}</Dado>
        <Dado rotulo="O último ano">{l.caixa}</Dado>
        <Dado rotulo="No caixa">{dinheiroCurto(n.caixa ?? 0)}<small> (do negócio, não seu)</small></Dado>
        <Dado rotulo="O nome">{l.reputacao}</Dado>
        <Dado rotulo="Tamanho">{porte}{(n.unidades ?? 1) > 1 ? ` · ${n.unidades} frentes` : ''}</Dado>
        <Dado rotulo="O jeito de vender">{jeito}</Dado>
        {n.socioId && vida.pessoas[n.socioId] && <Dado rotulo="Sócio">{vida.pessoas[n.socioId].vivo ? vida.pessoas[n.socioId].nome : `a família de ${vida.pessoas[n.socioId].nome}, que morreu`}, {Math.round(parteDoSocio(n) * 100)}% do negócio</Dado>}
        {melhorias.length > 0 && <Dado rotulo="O que já foi feito">{melhorias.map(m => NOMES_MELHORIA[m] ?? m).join(', ')}</Dado>}
      </dl>
      <div className="equipe">
        <p className="equipe__titulo">{l.gente}</p>
        {(n.equipe ?? []).length > 0 && (
          <ul className="equipe__rostos">
            {n.equipe!.map(f => { const q = vida.pessoas[f.pessoaId]; return q ? <li key={q.id}><Retrato visual={q.visual} genero={q.genero} idade={idadePessoa(vida, q)} semente={q.id} tamanho={40} rotulo={q.nome} /><span>{q.nome}<small>{f.funcao}</small></span></li> : null; })}
          </ul>
        )}
      </div>
      {t && n.semEstrada && (vida.t - n.tInicio) / 12 < 3 && <p className="nota">Você abriu sem conhecer o ramo: os primeiros anos pesam mais.</p>}
    </section>
  );
}

/**
 * A conta do ano, na ordem em que o dono entende: o que entrou, o que custou,
 * o que sobrou, o que você tirou para viver e o que ficou no caixa. Com o ano
 * fechado, os números do ano; antes disso, a conta como o negócio está hoje.
 */
function ContaDoNegocioAno({ vida }: { vida: Vida }) {
  const n = negocioAberto(vida)!;
  const fechado = n.faturamentoAno !== undefined;
  const k = contaDoAno(vida, n);
  const faturamento = fechado ? n.faturamentoAno! : k.faturamento;
  const lucro = fechado ? n.lucroAno ?? k.lucro : k.lucro;
  const retirada = fechado ? n.retiradaAno ?? k.retirada : k.retirada;
  const socio = n.socioId ? Math.round(lucro * parteDoSocio(n) / 100) * 100 : 0;
  const ficou = fechado ? n.resultadoAno ?? 0 : k.resultado;
  const custos = Math.max(0, faturamento - lucro);
  const s = n.socioId ? vida.pessoas[n.socioId] : undefined;
  const paralela = dedicacaoDe(n) === 'paralela' || n.passivo;
  return (
    <section className="conta-negocio" aria-label="A conta do negócio">
      <h4 className="conta-negocio__titulo">{fechado ? 'A conta do último ano' : 'A conta, como o negócio está hoje'}</h4>
      <dl className="dados dados--conta">
        <Dado rotulo="Faturamento">{dinheiroCurto(faturamento)} no ano</Dado>
        <Dado rotulo="Custos">{dinheiroCurto(custos)}<small> (mercadoria, ponto, contas{(n.equipe?.length ?? 0) > 0 ? ', equipe' : ''})</small></Dado>
        <Dado rotulo={lucro >= 0 ? 'Lucro' : 'Prejuízo'}>{dinheiroCurto(Math.abs(lucro))}{s && socio !== 0 ? <small> · {Math.round(parteDoSocio(n) * 100)}% são de {s.vivo ? s.nome : `herdeiros de ${s.nome}`} ({dinheiroCurto(Math.abs(socio))})</small> : null}</Dado>
        <Dado rotulo="Sua retirada">{paralela ? 'sem retirada fixa — o que é seu fica no caixa' : retirada > 0 ? <>{dinheiroCurto(retirada)} no ano<small> (≈ {dinheiroCurto(Math.round(retirada / 12 / 10) * 10)}/mês, para viver)</small></> : 'nada: o negócio não rendeu para isso'}</Dado>
        <Dado rotulo={ficou >= 0 ? 'Ficou no caixa' : 'Faltou'}>{dinheiroCurto(Math.abs(ficou))}{ficou < 0 ? <small> (saiu do seu bolso)</small> : <small> (reserva e reinvestimento)</small>}</Dado>
      </dl>
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

const CLUBES_REAIS = 'Clubes reais; peneiras, contratos, divisões e resultados são simulação do jogo.';

function PainelAtleta({ vida }: { vida: Vida }) {
  const es = vida.caminhos.esporte!;
  const i = idade(vida);
  const limite = es.modalidade === 'futebol' ? 33 : 31;
  return (
    <section className="painel painel--atleta" aria-label="A carreira no esporte">
      <div className="placar">
        <span className={`placar__espaco placar__espaco--${es.espaco ?? 'reserva'}`}>{es.espaco === 'titular' ? 'Titular' : 'Reserva'}</span>
        <span className="placar__clube">{es.clube}</span>
      </div>
      <dl className="dados">
        <Dado rotulo="Divisão (no jogo)">{DIVISAO_DO_NIVEL[es.nivel]}</Dado>
        <Dado rotulo="Contrato">{es.contratoAte ? `até ${anoDe(es.contratoAte)}` : '—'}</Dado>
        <Dado rotulo="No bolso">{dinheiroCurto(vida.trabalho.atual?.salario ?? 0)}/mês</Dado>
        <Dado rotulo="Treino">{es.foco === 'forcar' ? 'dobrado (evolui e machuca mais)' : es.foco === 'preservar' ? 'poupando o corpo' : 'o normal do clube'}</Dado>
        <Dado rotulo="O corpo">{es.lesoes === 0 ? 'sem lesões sérias' : `${es.lesoes} ${es.lesoes === 1 ? 'lesão' : 'lesões'} na carreira`}</Dado>
        <Dado rotulo="O prazo">{i < limite - 6 ? 'o auge está pela frente' : i < limite - 2 ? 'o auge é agora' : 'o fim se aproxima'}</Dado>
      </dl>
      <p className="nota">Quase ninguém joga profissionalmente depois dos 35. Quem se prepara ainda jogando tem para onde ir. {es.modalidade === 'futebol' ? CLUBES_REAIS : ''}</p>
    </section>
  );
}

/** A base: ainda não é emprego — é formação, com rotina de atleta. */
function PainelBase({ vida }: { vida: Vida }) {
  const es = vida.caminhos.esporte;
  if (!es || es.fase !== 'base') return null;
  const i = idade(vida);
  const categoria = es.modalidade !== 'futebol' ? 'equipe de base' : i <= 15 ? 'sub-15' : i <= 17 ? 'sub-17' : 'sub-20';
  const anos = Math.max(0, Math.floor((vida.t - es.tInicio) / 12));
  const contratoIdade = es.modalidade === 'futebol' ? '17 e 20' : '17 e 22';
  const longe = es.municipioId !== vida.moradia.municipioId;
  return (
    <section className="painel painel--atleta painel--base" aria-label="A base">
      <div className="placar">
        <span className="placar__espaco placar__espaco--base">{categoria}</span>
        <span className="placar__clube">{es.clube}</span>
      </div>
      <dl className="dados">
        <Dado rotulo="Situação">em formação, sem contrato profissional</Dado>
        <Dado rotulo="Rotina">treino quase todo dia{longe ? ', alojamento longe de casa' : ''}</Dado>
        <Dado rotulo="Há quanto tempo">{anos < 1 ? 'começou este ano' : `${anos} ${anos === 1 ? 'ano' : 'anos'}`}</Dado>
        <Dado rotulo="O corpo">{es.lesoes === 0 ? 'sem lesões sérias' : `${es.lesoes} ${es.lesoes === 1 ? 'lesão' : 'lesões'}`}</Dado>
      </dl>
      <p className="painel__frase">O que pode vir: um contrato profissional, entre os {contratoIdade} anos, para quem segue evoluindo — ou a dispensa, que é o destino da maioria. A escola e o resto da semana dividem espaço com o treino.</p>
      {es.modalidade === 'futebol' && <p className="nota">{CLUBES_REAIS}</p>}
    </section>
  );
}

function PainelFarda({ vida }: { vida: Vida }) {
  const m = vida.caminhos.militar;
  const postos = escadaMilitar(vida);
  const persp = perspectivasMilitares(vida);
  const inicial = m && m.quadro === 'temporario' && vida.t - m.tIngresso < 12;
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
          <Dado rotulo="Guarnição">{vida.moradia.municipioId === m.guarnicao ? 'na cidade onde mora' : 'longe de casa'}{m.transferencias ? ` · ${m.transferencias} ${m.transferencias === 1 ? 'transferência' : 'transferências'}` : ''}</Dado>
          {m.especialidade && <Dado rotulo="Especialidade">{ESPECIALIDADES[m.especialidade]?.nome ?? m.especialidade}</Dado>}
          <Dado rotulo="Tempo de serviço">{inicial ? 'o primeiro ano, dos doze meses obrigatórios' : `${Math.floor((vida.t - m.tIngresso) / 12)} anos`}</Dado>
          <Dado rotulo="Teste físico">{m.tafFalhou !== undefined && vida.t - m.tafFalhou <= 12 ? 'não passou no último' : 'em dia'}</Dado>
          {m.empregoGuardado && <Dado rotulo="Emprego guardado">{nomeOcupacao(vida, ocupacao(m.empregoGuardado.ocupacaoId))}, até a baixa</Dado>}
        </dl>
      )}
      {persp.length > 0 && (
        <div className="perspectivas">
          <p className="perspectivas__titulo">O que pode acontecer — e do que depende</p>
          <ul>{persp.map((x, k) => <li key={k}><strong>{x.oque}</strong><span>{x.depende}</span></li>)}</ul>
        </div>
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
  const p = vida.caminhos.politica;
  const m = p?.mandato;
  return (
    <section className={`painel painel--politica${principal ? ' painel--principal' : ''}`} aria-label="A vida política">
      {!principal && <h3 className="painel__titulo">A vida política · {l.titulo}</h3>}
      {m && <Medidor valor={m.aprovacao} rotulo="Aprovação" palavra={l.aprovacao ?? ''} />}
      <dl className="dados">
        {l.partido && <Dado rotulo="Partido">{l.partido}</Dado>}
        <Dado rotulo="Base de apoio">{l.apoio}</Dado>
        <Dado rotulo="O nome">{l.reputacao}</Dado>
        <Dado rotulo={m ? 'Prioridade do mandato' : 'Bandeira'}>{nomeDaBandeira(p?.prioridade)}</Dado>
        {l.estrutura && <Dado rotulo="O partido aqui">{l.estrutura}</Dado>}
        {l.desgaste && <Dado rotulo="Desgaste">{l.desgaste}</Dado>}
      </dl>
      {l.horizonte && <p className="painel__frase">{l.horizonte}</p>}
      {l.perspectiva && <p className="nota"><strong>Se fosse hoje.</strong> {l.perspectiva}</p>}
      {l.ultimaEleicao && <p className="nota"><strong>A última eleição.</strong> {l.ultimaEleicao}</p>}
      {l.escandalo && <p className="nota nota--atencao">{l.escandalo}</p>}
      {l.partidos && <p className="nota">{l.partidos}</p>}
      {l.historico.length > 0 && <ul className="historico-politico">{l.historico.map((h, k) => <li key={k}>{h}</li>)}</ul>}
      <p className="nota">Partidos reais, só pelo nome; eleições, crises e mandatos são simulação do jogo.</p>
    </section>
  );
}

function SituacaoDaPena({ vida }: { vida: Vida }) {
  const t = situacaoNaJustica(vida);
  return t ? <section className="painel painel--pena" aria-label="A pena"><p className="painel__frase">{t}</p></section> : null;
}

/* ============================================================ Em paralelo */

/** O que corre ao lado do trabalho principal: nada disso se perde num campo escondido. */
function EmParalelo({ vida, agir, irPara, modo }: { vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Aba) => void; modo: ModoTrabalho }) {
  const n = negocioAberto(vida);
  // Sem outro trabalho, o negócio já é a situação de agora (não aparece duas vezes).
  const negocioParalelo = n && !donoIntegral(vida) && modo !== 'negocio' ? n : undefined;
  const base = vida.caminhos.esporte?.fase === 'base' && modo !== 'base';
  const pol = !!leituraPolitica(vida) && naPolitica(vida) && modo !== 'politica';
  const arte = !!vida.caminhos.arte?.ativo && modo !== 'artista';
  const renda = vida.rotinas.map(r => modeloRotina(r.id)).filter(m => m?.categoria === 'renda');
  const concurso = vida.rotinas.some(r => r.id === 'estudar_concurso');
  const porFora = leituraDoEnvolvimento(vida);
  if (!negocioParalelo && !base && !pol && !arte && !renda.length && !concurso && !porFora) return null;
  const acoesNeg = negocioParalelo ? separarNegocio(acoesDoNegocio(vida, disponibilidade)) : undefined;
  return (
    <section className="camada camada--paralelo" aria-labelledby="camada-paralelo">
      <h2 id="camada-paralelo" className="camada__titulo">Em paralelo</h2>
      {negocioParalelo && (
        <div className="paralelo">
          <h3 className="paralelo__titulo">{negocioParalelo.nome}<span> · {negocioParalelo.passivo ? ((negocioParalelo.equipe?.length ?? 0) > 0 ? 'nas mãos da equipe' : 'nas mãos do sócio') : 'nas horas vagas'}</span></h3>
          <PainelNegocio vida={vida} />
          {acoesNeg && acoesNeg.agora.length > 0 && <AcoesVivas acoes={acoesNeg.agora} agir={agir} rotulo={`O que fazer por ${negocioParalelo.nome}`} />}
          {acoesNeg && (acoesNeg.mais.length > 0 || acoesNeg.saidas.length > 0) && <Mais mais={acoesNeg.mais} saidas={acoesNeg.saidas} agir={agir} ir={d => irPara(d as Aba)} />}
        </div>
      )}
      {base && <div className="paralelo"><h3 className="paralelo__titulo">{vida.caminhos.esporte!.modalidade === 'futebol' ? 'A base' : 'A equipe'} {doClube(vida.caminhos.esporte!.clube)}</h3><PainelBase vida={vida} /></div>}
      {pol && <div className="paralelo"><PainelPolitico vida={vida} principal={false} /></div>}
      {arte && <div className="paralelo"><h3 className="paralelo__titulo">{vida.caminhos.arte!.nome}<span> · {vida.caminhos.arte!.tipo === 'banda' ? 'a banda' : 'o grupo'}</span></h3><p className="nota">{vida.caminhos.arte!.publico < 15 ? 'Quase ninguém conhece ainda.' : vida.caminhos.arte!.publico < 40 ? 'Já tem quem vá ver.' : vida.caminhos.arte!.publico < 65 ? 'Público fiel na cidade.' : 'Gente de fora já conhece.'}</p></div>}
      {renda.length > 0 && <div className="paralelo"><h3 className="paralelo__titulo">Por fora</h3><p className="nota">{renda.map(m => m!.nome).join(' · ')} — na sua semana, em <button type="button" className="link" onClick={() => irPara('tempo')}>Tempo livre</button>.</p></div>}
      {concurso && <div className="paralelo"><h3 className="paralelo__titulo">Estudando para concurso</h3><p className="nota">{vida.caminhos.concurso.meses >= 12 ? `O equivalente a ${Math.round(vida.caminhos.concurso.meses / 12)} ${Math.round(vida.caminhos.concurso.meses / 12) === 1 ? 'ano' : 'anos'} de estudo firme.` : 'Começando.'} Os editais abertos estão em "Outras possibilidades".</p></div>}
      {porFora && (
        <section className="por-fora" aria-label="Por fora">
          <p className="por-fora__titulo">Por fora</p>
          <p>{porFora}</p>
          <BotaoAcao vida={vida} acao={{ tipo: 'parar_por_fora' }} agir={agir} variante="secundario" ocultarBloqueado>Largar isso de vez</BotaoAcao>
        </section>
      )}
    </section>
  );
}

function separarNegocio(lista: AcaoProfissional[]): { agora: AcaoProfissional[]; mais: AcaoProfissional[]; saidas: AcaoProfissional[] } {
  const saidas = lista.filter(x => x.saida);
  const resto = lista.filter(x => !x.saida).sort((a, b) => b.peso - a.peso);
  const fortes = resto.filter(x => x.peso >= 3).slice(0, 4);
  const agora = fortes.length ? fortes : resto.slice(0, 2);
  return { agora, mais: resto.filter(x => !agora.includes(x)), saidas };
}

/* ================================================== Outras possibilidades */

function OutrasPossibilidades({ vida, agir, aberto, alternar, irPara }: { vida: Vida; agir: (a: Acao) => boolean; aberto: boolean; alternar: () => void; irPara: (a: Aba) => void }) {
  const i = idade(vida);
  const abas = [
    { id: 'vagas', rotulo: 'Vagas' },
    ...(i >= 17 && !vida.justica?.prisao ? [{ id: 'concursos', rotulo: 'Concursos' }] : []),
    ...(i >= 18 ? [{ id: 'negocio', rotulo: 'Negócio próprio' }] : []),
    ...(i >= 16 ? [{ id: 'caminhos', rotulo: 'Outros caminhos' }] : [])
  ];
  const [aba, setAba] = useState('vagas');
  return (
    <section className="explorar-trabalho camada camada--explorar" aria-labelledby="titulo-explorar">
      <button type="button" id="titulo-explorar" className="explorar-trabalho__titulo" aria-expanded={aberto} onClick={alternar}>
        <span>Outras possibilidades</span><span className="explorar-trabalho__sub">vagas, concursos, o próprio negócio, outros caminhos</span>
      </button>
      {aberto && (
        <div className="explorar-trabalho__corpo">
          {abas.length > 1 && <Escolha rotulo="O que procurar" valor={aba} aoMudar={setAba} opcoes={abas} />}
          {aba === 'vagas' && <Vagas vida={vida} agir={agir} />}
          {aba === 'concursos' && <Concursos vida={vida} agir={agir} />}
          {aba === 'negocio' && <Negocios vida={vida} agir={agir} />}
          {aba === 'caminhos' && <OutrosCaminhos vida={vida} agir={agir} irPara={irPara} />}
        </div>
      )}
    </section>
  );
}

/** O que uma vaga conflitaria, dito antes de se candidatar. */
function avisoDeConflito(vida: Vida, oc: Ocupacao): string | undefined {
  const c = analisarEntrada(vida, { tipo: 'emprego', ocupacaoId: oc.id, via: 'curriculo' });
  const atual = vida.trabalho.atual;
  const troca = atual && atual.contrato !== 'eletivo' && !donoIntegral(vida) ? `Entrar aqui é deixar o trabalho de ${nomeOcupacao(vida, ocupacao(atual.ocupacaoId))}.` : undefined;
  const partes = [troca, ...c.map(x => `${x.motivo}: ${x.impede ? 'não dá agora' : 'se passar, a vida pergunta o que fazer'}.`)].filter(Boolean);
  return partes.length ? partes.join(' ') : undefined;
}

function Vagas({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const atual = vida.trabalho.atual?.ocupacaoId;
  const { para } = vagasParaVoce(vida);
  const sugestao = new Map(para.map(x => [x.item.oc.id, x.motivo]));
  const usadas = vida.anoAtual.acoes.filter(a => a.startsWith('candidatura:')).length;
  if (idade(vida) < 14) return null;
  const itens: ItemCatalogo[] = OCUPACOES.filter(oc => !oc.concurso && oc.id !== atual && oc.entrada !== 'eleicao' && oc.entrada !== 'negocio').map(oc => {
    const d = elegibilidade(vida, oc);
    const pode = podeTentar(d) && oc.entrada !== 'oportunidade';
    const f = familiaDaTrilha(oc.trilha);
    const acima = degrausAcima(oc).slice(0, 2).map(x => nomeOcupacao(vida, x));
    const aviso = pode ? avisoDeConflito(vida, oc) : undefined;
    const tipo = porContaPropria(oc) ? 'conta' : oc.experiencia ? 'estrada' : oc.nivel <= 1 ? 'entrada' : 'emprego';
    return {
      id: oc.id,
      titulo: nomeOcupacao(vida, oc),
      grupo: f.nome,
      tipo,
      meta: `${ROTULO_SETOR[oc.setor]} · a partir de ${dinheiroCurto(oc.salario)}${oc.carga === 'parcial' ? ' · meio período' : ''}${oc.jornada === 'fora' ? ' · dias fora de casa' : oc.jornada === 'longa' ? ' · jornada longa' : oc.jornada === 'plantao' ? ' · plantões' : ''}`,
      motivo: sugestao.get(oc.id),
      destaque: sugestao.has(oc.id),
      possivel: pode,
      bloqueio: oc.entrada === 'oportunidade' ? 'Não se entra por currículo: chega por uma oportunidade concreta (convite, peneira, contrato).' : d.motivo,
      busca: `${ROTULO_TRILHA[oc.trilha] ?? ''} ${ROTULO_SETOR[oc.setor]}`,
      detalhe: (
        <div className="vaga-detalhe">
          <p><strong>Como se entra:</strong> {f.entrada}.</p>
          {acima.length > 0 && <p><strong>Para onde leva:</strong> {acima.join(', ')}.</p>}
          {f.degraus.length > 0 && <p><strong>Como se cresce:</strong> {f.degraus.join(' → ')}.</p>}
          {pode && d.chance !== undefined && !porContaPropria(oc) && <p><strong>Chance de passar na seleção:</strong> {d.chance >= 0.6 ? 'boa' : d.chance >= 0.35 ? 'razoável' : 'baixa'}.</p>}
          {aviso && <p className="nota nota--atencao"><span aria-hidden>! </span>{aviso}</p>}
        </div>
      ),
      acao: <BotaoAcao vida={vida} acao={{ tipo: 'candidatar', ocupacaoId: oc.id }} agir={agir} mostrarChance={!porContaPropria(oc)}>{porContaPropria(oc) ? 'Começar por conta' : 'Candidatar-se'}</BotaoAcao>
    };
  });
  return (
    <div className="explorar-bloco">
      <p className="dica">Candidatar-se leva a uma entrevista de duas ou três perguntas. Até três processos por ano ({Math.max(0, 3 - usadas)} restantes). Por conta própria não há entrevista: a freguesia é que decide.</p>
      <Catalogo itens={itens} rotulo="Vagas" dicaBusca="enfermagem, cozinha, motorista, TI…" tipos={[{ id: 'entrada', rotulo: 'Para começar' }, { id: 'emprego', rotulo: 'Com carteira' }, { id: 'estrada', rotulo: 'Pede estrada' }, { id: 'conta', rotulo: 'Por conta própria' }]} vazio="Nenhuma vaga com esse filtro." />
    </div>
  );
}

function Concursos({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const editais = editaisAbertos(vida).map(oc => ({ oc, d: elegibilidade(vida, oc) })).filter(x => podeTentar(x.d));
  const estudando = vida.rotinas.some(r => r.id === 'estudar_concurso');
  return (
    <div className="explorar-bloco">
      <p className="dica">{estudando ? `Você estuda para concurso${vida.caminhos.concurso.meses >= 12 ? ` — o equivalente a ${Math.round(vida.caminhos.concurso.meses / 12)} ${Math.round(vida.caminhos.concurso.meses / 12) === 1 ? 'ano' : 'anos'} de estudo firme` : ''}.` : 'Concurso pede preparo: sem estudo, é quase loteria. O estudo entra em Tempo livre.'} Aprovado não é empossado: se a posse significar largar alguma coisa, a vida pergunta.</p>
      {editais.length === 0 && <p className="vazio">Nenhum edital aberto que caiba no seu perfil este ano.</p>}
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

const PRESENCA_TXT = { rua: 'porta aberta para a rua', online: 'loja na internet, sem balcão', atendimento: 'agenda de atendimento', obra: 'serviço na casa do cliente' } as const;

function Negocios({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const aberto = negocioAberto(vida);
  if (aberto) return <p className="nota">Você já tem {aberto.nome} ({dedicacaoDe(aberto) === 'paralela' ? 'nas horas vagas' : 'como trabalho de todo dia'}). Um negócio de cada vez.</p>;
  const lista = negociosPossiveis(vida);
  const e = vida.trabalho.atual;
  return (
    <div className="explorar-bloco">
      <p className="dica">Abrir é um processo: com o dinheiro guardado, pequeno e em casa, com empréstimo ou com um sócio. {e ? `Abrir não é pedir demissão: dá para tocar nas horas vagas e manter o trabalho de ${nomeOcupacao(vida, ocupacao(e.ocupacaoId))} — ou largar e se dedicar. A escolha vem na hora.` : 'O negócio tem caixa próprio; crescer custa.'}</p>
      <ul className="lista-vagas">
        {lista.map(n => {
          const pode = podeTentar(n.veredito);
          return (
            <li key={n.t.id} className={`vaga${pode ? '' : ' vaga--bloqueada'}`}>
              <div className="vaga__texto"><strong>Abrir {n.t.nome}</strong><span>{PRESENCA_TXT[n.t.presenca]} · uns {dinheiroCurto(n.custo)} para começar{n.t.emCasa ? ` (ou uns ${dinheiroCurto(n.custo * 0.4)} começando em casa)` : ''}</span>{!pode && n.veredito.motivo && <span className="vaga__motivo">{n.veredito.motivo}</span>}</div>
              {pode && <BotaoAcao vida={vida} acao={{ tipo: 'abrir_negocio', negocio: n.t.id }} agir={agir}>Pensar em abrir</BotaoAcao>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Mudanças de caminho que não são um cargo: a vida política. */
function OutrosCaminhos({ vida, agir, irPara }: { vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Aba) => void }) {
  const lp = leituraPolitica(vida);
  const dentro = naPolitica(vida);
  const portas = portasDaPolitica(vida);
  return (
    <div className="explorar-bloco">
      <div className="caminho-politico">
        <h3 className="paralelo__titulo">A vida política</h3>
        <p className="caminho-politico__texto">{dentro && lp ? `${lp.titulo}. ${lp.horizonte ?? ''}` : portas.length ? 'A vida que você leva já puxa gente para perto: associação, causa, nome conhecido. A política é uma porta possível.' : 'A vida política começa perto: a associação do bairro, uma causa, um partido da cidade.'}</p>
        {dentro ? <p className="nota">Ela aparece acima, na sua situação ou em paralelo.</p>
          : <BotaoAcao vida={vida} acao={{ tipo: 'politica', oque: 'aproximar' }} agir={agir} variante="secundario" ocultarBloqueado>{lp ? 'Voltar à vida política' : 'Aproximar-se da vida política'}</BotaoAcao>}
      </div>
      <div className="caminho-politico">
        <h3 className="paralelo__titulo">Estudar para mudar de caminho</h3>
        <p className="caminho-politico__texto">Cursos, faculdade, qualificação — tudo o que abre outras portas mora em Estudos.</p>
        <button type="button" className="botao botao--discreto" onClick={() => irPara('estudos')}>Ir para Estudos →</button>
      </div>
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
