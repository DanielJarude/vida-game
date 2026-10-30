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

import { GaleriaDeConquistas } from './Galeria';
import { CampoDoAtleta, ClaqueteDoAtor, PalcoDoMusico, PlenarioDoPolitico, PranchetaDoTecnico } from './CarreirasEspeciais';
import { habilitacaoDaVida } from '../../motor/sistemas/autoescola';
import { regrasDaVida } from '../../motor/mundo/regras';
import { nomeDoRegistro, previdenciaDaVida, textoLocal } from '../../motor/mundo/locais';
import { useMemo, useRef, useState } from 'react';
import type { Devolutiva, Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { disponibilidade } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { anoDe, mesDe } from '../../motor/tempo';
import { OCUPACOES, ROTULO_SETOR, ROTULO_TRILHA, ocupacao, ocupacaoOuNula, type Ocupacao } from '../../motor/dados/ocupacoes';
import { familiaDaTrilha } from '../../motor/dados/carreiras';
import { ESPECIALIDADES } from '../../motor/dados/forcas';
import { degrausAcima, elegibilidade, horizonte, modeloDeTrabalho, nomeOcupacao, estradaNaArea, porContaPropria, proximoPasso, requisitosDaVaga, ROTULO_MODELO, temOrganizacao } from '../../motor/sistemas/trabalho';
import { verbosDoOficio } from '../../motor/sistemas/noOficio';
import { situacaoProfissional, type SituacaoProfissional } from '../../motor/sistemas/situacaoProfissional';
import { acoesDasTrajetorias, acoesDoTrabalho, chefiaAtual, leituraDoClima, leituraDoTrabalho, modoDoTrabalho, ritmoDe, rotulosDoRitmo, type AcaoProfissional, type ModoTrabalho } from '../../motor/sistemas/profissao';
import { acoesDoNegocio } from '../../motor/sistemas/gestao';
import { contaDoAno, dedicacaoDe, donoIntegral, estrategiaDe, leituraDoNegocio, negocioAberto, negociosPossiveis, parteDoSocio, presencaDe, tetoDoMovimento, tipoDoNegocio } from '../../motor/sistemas/negocio';
import { rotuloEstrategia } from '../../motor/dados/negocios';
import { leituraPolitica, naPolitica, nomeDaBandeira } from '../../motor/sistemas/politica';
import { escadaMilitar, perspectivasMilitares } from '../../motor/sistemas/militar';
import { editaisAbertos, editalDe, FOCO_DO_CARGO, lerPreparo, NOME_DA_ESFERA, NOME_FOCO } from '../../motor/sistemas/concurso';
import { leituraDaEquipe } from '../../motor/sistemas/equipe';
import { caminhosPossiveis, emConstrucao, type CaminhoPossivel } from '../../motor/sistemas/caminhosDeVida';
import { perfilParaVaga, type PerfilVaga } from '../../motor/sistemas/empregabilidade';
import { BlocoDeVagas, CaminhosPossiveis, EmConstrucao, PerfilDaVaga, ProximoPassoPainel } from './Caminhos';
import { vagasEmCamadas, type Vaga } from '../../motor/sistemas/relevancia';
import type { Relevante } from '../../motor/sistemas/relevancia';
import { O_QUE_TRABALHAR } from '../../motor/sistemas/devolutivas';
import { situacaoNaJustica } from '../../motor/sistemas/justica';
import { foragido, leituraDaPena, situacaoDeForagido, type OquePrisao } from '../../motor/sistemas/prisao';
import { leituraDaPausa } from '../../motor/sistemas/pausa';
import { leituraDoEnvolvimento } from '../../motor/sistemas/ilicito';
import { leituraRural } from '../../motor/sistemas/rural';
import { leituraDaOrigem, responsaveis } from '../../motor/sistemas/origem';
import { analisarEntrada, notaDaBaseCom } from '../../motor/sistemas/compromissos';
import { modeloRotina } from '../../motor/sistemas/rotinas';
import { divisaoDoNivel, doClube } from '../../motor/dados/clubes';
import { nomeLugar, paisDaCidade } from '../../motor/dados/lugares';
import { augeDe, carreirasEsportivas, categoriaDaBase, clubeAtual, divisaoDe, NOME_MOD, linhaDaTemporada, nivelQueOMercadoOferece, nomePosicao, palavraDaNota, palavraDaReputacao, posicaoDe, ultimoClubeDe } from '../../motor/sistemas/esporte';
import { NOME_ATRIBUTO, perfilDeAtributos } from '../../motor/sistemas/atributosEsportivos';
import { NIVEIS_DE_LICENCA, licencaDe } from '../../motor/sistemas/oficioDoTecnico';
import { formatarDinheiroCurto } from '../../motor/mundo/moeda';
import { habilidade } from '../../motor/sistemas/frentes';
import { capitalizar as cap, dinheiro as fmtDinheiro } from '../../motor/texto';
import { circuitoPeloRanking, estatura, estaturaEmPalavras, funcaoBasquete, NOME_FUNCAO } from '../../motor/sistemas/modalidades';
import { categoriaDeLuta, funcaoVolei, NOME_FUNCAO_VOLEI, provaDe } from '../../motor/sistemas/provas';
import { lesaoAtiva } from '../../motor/sistemas/lesoes';
import { leituraDoNome } from '../../motor/sistemas/notoriedade';
import { leituraDoPalmares, palmaresDe } from '../../motor/sistemas/palmares';
import { celulaDoHistorico, GlifoConquista, GlifoDaLinha } from '../iconesConquista';
import { historicoDaCarreira, perfilDe, resumoDaCarreira, semVinculo } from '../../motor/sistemas/perfisEsportivos';
import { comoAcabou, linhaDoTecnico, passagemAtual, periodoDaPassagem, resumoDaPassagem, resumoDoTecnico } from '../../motor/sistemas/tecnico';
import { momentosPorCarreira } from '../../motor/sistemas/situacoes';
import { podeTentar } from '../../motor/plausibilidade';
import { AcoesVivas, BotaoAcao, Dado, Escolha, Folio, Linha, Medidor, Percurso, Renomear, Secao, type Passo } from '../comum';
import { EmblemaDoOficio } from './Emblemas';
import { Retrato } from '../avatar/Retrato';
import { idadePessoa } from '../../motor/nucleo';
import { dinheiroCurto } from '../apresentar';
import { ehPortaDeTrabalho, ObjetivosEmCurso, PortasAbertas } from './Estudos';
import { Catalogo, type ItemCatalogo } from './Catalogo';
import { leituraDasTrajetorias } from '../../motor/sistemas/paralelas';
import { leituraDoCurriculo } from '../../motor/sistemas/cena';
import { contaDoContrato, impactoDoContrato, NOME_DO_TIPO } from '../../motor/sistemas/audiovisual';
import { empregoAcademico, leituraAcademica } from '../../motor/sistemas/academia';
import type { Aba, ParteCaminhos } from '../navegacao';
import { areaProfissional } from '../../motor/dados/areasProfissionais';
import { vagaDaOrganizacao } from '../../motor/sistemas/organizacoes';
import { vagasAcima } from '../../motor/sistemas/relevancia';
import { trajetoriaDeAreas } from '../../motor/sistemas/areasDoOficio';

interface Props { vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Aba) => void }

/** As situações que não são uma família de carreira (a pena, a procura, a aposentadoria, o próprio negócio). */
const SITUACOES = new Set<string>(['preso', 'procurando', 'sem_procurar', 'aposentado', 'pausa', 'crianca', 'estudante', 'negocio', 'politica', 'base', 'plataforma', 'atleta', 'artista']);

/** A chave do emblema e do tom: a família de carreira do trabalho de agora (`dados/carreiras`), ou a situação. */
export function chaveDoOficio(vida: Vida, modo: ModoTrabalho): string {
  if (SITUACOES.has(modo)) return modo;
  const oc = vida.trabalho.atual ? ocupacaoOuNula(vida.trabalho.atual.ocupacaoId) : undefined;
  return oc ? familiaDaTrilha(oc.trilha).id : modo;
}

const NOME_FAMILIA: Record<string, string> = {
  varejo: 'comércio e vendas', escritorio: 'escritório', transporte: 'transporte', cozinha: 'cozinha', beleza: 'beleza', oficio: 'obra e conserto', industria: 'indústria',
  tecnologia: 'tecnologia', saude: 'saúde', cuidado: 'cuidado', predial: 'portaria e vigilância', docencia: 'ensino', academia: 'ciência', direito: 'direito',
  engenharia: 'engenharia', publico: 'serviço público', seguranca: 'segurança pública', militar: 'Forças Armadas', rural: 'campo e água', criacao: 'criação', palco: 'palco', esporte: 'esporte', informal: 'rua e bicos'
};

const KICKER: Partial<Record<ModoTrabalho, string>> = {
  negocio: 'o próprio negócio', autonomo: 'por conta própria', informal: 'por conta, na rua', plataforma: 'sem chefe, sem piso', rural: 'a terra', pesca: 'a água',
  artista: 'a obra', atleta: 'o esporte', tecnico: 'o banco', militar: 'a farda', seguranca: 'a segurança pública', servidor: 'o serviço público', docente: 'a sala de aula', saude: 'o cuidado',
  empregado: 'com carteira', politica: 'a vida pública', formacao: 'a formação', aprendiz: 'o primeiro trabalho', estagio: 'o estágio', procurando: 'a procura', sem_procurar: 'por escolha',
  aposentado: 'depois do trabalho', pausa: 'cuidando', preso: 'a pena', estudante: 'antes do trabalho', base: 'a base', crianca: 'ainda não'
};

/** Uma ação que é vida pública (a política, o caminho dos concursos): mora na divisão Vida pública (REWORK 9.6). */
export const ehAcaoPublica = (x: AcaoProfissional) => x.id.startsWith('pol_') || x.id === 'concursos';

/**
 * O TRABALHO como um lado de Caminhos (REWORK 9). Sem `parte`, a página inteira (como antes); com `parte`, só o que é
 * dela: AGORA (o ofício, a situação, os painéis de cada carreira, o dia a dia, o que corre em paralelo, a trajetória),
 * DESENVOLVIMENTO (o que você está construindo, os retornos das tentativas), OPORTUNIDADES (as portas, procurar outro
 * caminho — aberto, nesta aba —, os objetivos) e HISTÓRICO (o currículo, a carreira no esporte e no banco, os
 * momentos, por onde passou). `explorar`/`aoExplorar`: a aba da procura, que Caminhos guarda (um passo em Agora pode
 * apontar para os concursos em Oportunidades).
 */
export function Trabalho({ vida, agir, irPara, parte, explorar: abaDeFora, aoExplorar, divisao }: Props & { parte?: ParteCaminhos; explorar?: string; aoExplorar?: (a: string) => void; divisao?: boolean }) {
  const em = (p: ParteCaminhos) => !parte || parte === p;
  // REWORK 9.6 · UX-09/10: como DIVISÃO de Caminhos, o Trabalho é só trabalho — a vida pública (concursos, política) e
  // os outros caminhos (esporte, arte) têm a sua própria divisão; aqui ficam ligações para lá, nunca as mesmas ações.
  const div = !!divisao;
  const modo = modoDoTrabalho(vida);
  const l = leituraDoTrabalho(vida);
  const [explorarLocal, setExplorar] = useState(modo === 'procurando');
  const explorar = parte === 'oportunidades' || explorarLocal;
  const [abaLocal, setAbaLocal] = useState('vagas');
  const aba = abaDeFora ?? abaLocal;
  const setAba = (a: string) => { setAbaLocal(a); aoExplorar?.(a); };
  const explorarRef = useRef<HTMLDivElement>(null);
  // Em Caminhos, cada aba é um Trabalho: só calcula o que a aba mostra (as ações do dia a dia, em Agora; o que está
  // em construção, em Desenvolvimento).
  const acoes = useMemo(() => (em('agora') ? acoesDoTrabalho(vida, disponibilidade) : { agora: [], mais: [], saidas: [] }), [vida, parte]);
  const construindo = useMemo(() => (em('desenvolvimento') && !div ? emConstrucao(vida, disponibilidade) : []), [vida, parte, div]);
  const ir = (d: string) => {
    // Os passos de um caminho apontam para a procura (e uma aba dela) ou para outra área.
    const abaDe: Record<string, string> = { explorar: 'vagas', concursos: 'concursos', negocio: 'negocio', caminhos: 'caminhos' };
    // Na divisão, os concursos e os outros caminhos moram nas suas divisões.
    if (div && d === 'concursos') { irPara('concursos'); return; }
    if (div && d === 'caminhos') { irPara('outros_caminhos'); return; }
    if (div && abaDe[d] && parte !== 'oportunidades') { setAba(abaDe[d]); irPara(d === 'negocio' ? 'negocio' : 'vagas'); return; }
    if (abaDe[d]) {
      setAba(abaDe[d]); setExplorar(true);
      // Em Caminhos, a procura mora na aba Oportunidades: o passo leva até lá.
      if (parte && parte !== 'oportunidades') { irPara('oportunidades'); return; }
      setTimeout(() => explorarRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }), 30);
      return;
    }
    irPara(d as Aba);
  };
  const e = vida.trabalho.atual;
  const desde = e ? `desde ${anoDe(e.tInicio)}` : '';
  const preso = modo === 'preso';
  const pol = leituraPolitica(vida);
  // REWORK 11 · Fase B: a carreira especial sem contrato (o atleta sem clube, o técnico sem clube, o artista entre
  // trabalhos) é a carreira dela aqui — o nome, a situação, o painel — e não "Sem trabalho".
  const sp = situacaoProfissional(vida);
  const semVinculo = !e && sp.semVinculo && !preso;
  const espSemClube = semVinculo && sp.carreira === 'esporte' && !!vida.caminhos.esporte;
  const familia = semVinculo ? (sp.carreira === 'esporte' ? 'atleta' : sp.carreira === 'arte' ? 'artista' : 'esporte') : chaveDoOficio(vida, modo);
  const titulo = modo === 'politica' && pol ? pol.titulo : semVinculo ? sp.rotulo : l.titulo;
  const lede = modo === 'politica' && pol ? pol.etapa : semVinculo ? fraseSemVinculo(sp) : l.frases[0];
  return (
    <div className={`trabalho trabalho--${modo} trabalho--familia-${familia}`}>
      {/* REWORK 7: cada família de carreira tem o seu emblema e o seu tom — a enfermeira, o advogado, o pedreiro, a
          atleta e o preso não abrem a mesma página com outro nome. O resto (os painéis) já era de cada ofício. */}
      {(!parte || parte === 'agora') && <header className={parte ? 'folio folio--oficio lado-caminho__cabeca lado-caminho__cabeca--oficio' : 'folio folio--oficio'}>
        <EmblemaDoOficio chave={familia} tamanho={56} />
        <div className="folio__corpo">
          <p className="folio__kicker"><span className="folio__area">Trabalho</span> · {semVinculo ? (sp.carreira === 'esporte' ? KICKER.atleta : sp.carreira === 'arte' ? KICKER.artista : 'o banco') : modo === 'empregado' ? textoLocal(vida, 'comContrato') : KICKER[modo] ?? ''}{desde ? ` · ${desde}` : ''}{NOME_FAMILIA[familia] ? <span className="folio__familia"> · {NOME_FAMILIA[familia]}</span> : null}</p>
          {parte ? <h2 className="folio__titulo">{titulo}</h2> : <h1 className="folio__titulo">{titulo}</h1>}
          {lede && <p className="folio__lede" data-situacao-profissional={sp.situacao}>{lede}</p>}
        </div>
      </header>}

      {/* REWORK 10.6 · C3: as ações principais do trabalho, logo no alto (procurar ou mudar, as candidaturas, a carreira,
          as outras possibilidades) — antes, "procurar emprego" exigia saber que a procura morava na terceira aba. */}
      {parte === 'agora' && div && !preso && modo !== 'crianca' && <AcoesPrincipaisDoTrabalho vida={vida} irPara={irPara} />}
      {em('agora') && <section className="camada camada--agora" aria-labelledby="camada-agora">
        <h2 id="camada-agora" className="camada__titulo">A sua situação agora</h2>
        {(e || modo === 'negocio') && modo !== 'politica' && (
          <dl className="ficha-trabalho">
            {l.onde && !/^Por conta própria$|^A internet$|^Por encomenda$/i.test(l.onde) && <Dado rotulo="Onde">{l.onde}</Dado>}
            {l.renda && <Dado rotulo="No bolso">{l.renda.replace(' por mês no bolso', '/mês')}</Dado>}
            {l.jornada && <Dado rotulo="Jornada">{l.jornada}</Dado>}
            {l.vinculo && <Dado rotulo="Vínculo">{l.vinculo}</Dado>}
            {e?.especialidade && modo !== 'militar' && (ocupacaoOuNula(e.ocupacaoId)?.trilha === 'medicina'
              ? <Dado rotulo="Especialidade">{e.especialidade} <small>(o título da residência: decide as vagas, a faixa de renda e os casos)</small></Dado>
              : <Dado rotulo="Área">{e.especialidade} <small>{areaProfissional(e.especialidade)?.descricao ?? '(pesa nos casos grandes e no desempenho)'}</small></Dado>)}
          </dl>
        )}
        {l.frases.length > 1 && modo !== 'politica' && <div className="como-vai">{l.frases.slice(1).map((f, k) => <p key={k}>{f}</p>)}</div>}

        {preso && <PainelDaPena vida={vida} agir={agir} />}
        {foragido(vida) && <PainelForagido vida={vida} agir={agir} />}
        {modo === 'pausa' && <p className="nota-grande">{leituraDaPausa(vida)}</p>}
        {/* REWORK 10 · ECO-03: o seguro-desemprego vem em parcelas — quantas faltam, de quanto, e o que as encerra. */}
        {vida.trabalho.seguroDesemprego && <p className="nota-grande">Seguro-desemprego: faltam {vida.trabalho.seguroDesemprego.restantes} de {vida.trabalho.seguroDesemprego.total} parcelas de {fmtDinheiro(vida.trabalho.seguroDesemprego.parcela)}, uma por mês. Um emprego formal encerra as que faltarem; um bico, não.</p>}
        {modo === 'negocio' && <PainelNegocio vida={vida} />}
        {modo === 'negocio' && negocioAberto(vida) && <Renomear vida={vida} agir={agir} alvo="negocio" atual={negocioAberto(vida)!.nome} rotulo={`Dar outro nome a ${negocioAberto(vida)!.nome}`} />}
        {modo === 'artista' && vida.caminhos.arte?.ativo && <Renomear vida={vida} agir={agir} alvo="grupo" atual={vida.caminhos.arte.nome} rotulo={`Dar outro nome a ${vida.caminhos.arte.nome}`} />}
        {/* REWORK 10.5 · UX-19: a atuação tem um painel só, do primeiro teste ao ator conhecido (antes: a freguesia do autônomo, e depois a escada de cargos do empregado). */}
        {/* REWORK 11.5 · UI-01: a cabeça de cada carreira especial, com o lugar dela (o set, o palco, o campo, a prancheta). */}
        {modo === 'artista' && e && ocupacaoOuNula(e.ocupacaoId)?.trilha === 'cena' && <ClaqueteDoAtor vida={vida} />}
        {modo === 'artista' && e && ['musica', 'orquestra'].includes(ocupacaoOuNula(e.ocupacaoId)?.trilha ?? '') && <PalcoDoMusico vida={vida} />}
        {(modo === 'atleta' || espSemClube) && <CampoDoAtleta vida={vida} />}
        {modo === 'tecnico' && <PranchetaDoTecnico vida={vida} agir={agir} />}
        {pol && modo === 'politica' && !div && <PlenarioDoPolitico vida={vida} agir={agir} />}
        {modo === 'artista' && e && ocupacaoOuNula(e.ocupacaoId)?.trilha === 'cena' ? <PainelCena vida={vida} />
          : (modo === 'autonomo' || modo === 'informal' || modo === 'plataforma' || modo === 'artista') && <PainelFreguesia vida={vida} />}
        {(modo === 'rural' || modo === 'pesca') && <PainelCampo vida={vida} />}
        {(modo === 'atleta' || espSemClube) && <PainelAtleta vida={vida} />}
        {modo === 'tecnico' && <PainelComissao vida={vida} />}
        {modo === 'base' && !div && <PainelBase vida={vida} />}
        {modo === 'base' && div && <p className="ligacao-caminho"><span>A base, os treinos e a peneira estão em Outros caminhos.</span> <button type="button" className="link" onClick={() => irPara('outros_caminhos')}>Ir para Outros caminhos →</button></p>}
        {modo === 'militar' && <PainelFarda vida={vida} />}
        {(modo === 'servidor' || modo === 'docente') && <PainelCarreiraPublica vida={vida} />}
        {(modo === 'empregado' || modo === 'saude' || modo === 'seguranca' || modo === 'aprendiz' || modo === 'estagio' || modo === 'formacao') && <PainelEstrada vida={vida} />}
        {pol && modo === 'politica' && !div && <PainelPolitico vida={vida} principal />}
        {pol && modo === 'politica' && div && <p className="ligacao-caminho"><span>O mandato, a agenda política e as eleições estão em Vida pública.</span> <button type="button" className="link" onClick={() => irPara('vida_publica')}>Ir para Vida pública →</button></p>}
        {e && empregoAcademico(vida) === e && <PainelAcademia vida={vida} />}

        <NoDiaADia vida={vida} agir={agir} />
        {/* REWORK 9.5 · UX-07: a hierarquia segue a situação. Quem procura emprego vê as vagas primeiro; a política e os
            concursos (vida pública) continuam a um toque, agrupados — a não ser que a vida pública SEJA a situação. */}
        {(() => {
          const publicaPrincipal = !div && (modo === 'politica' || modo === 'servidor');
          const principais = publicaPrincipal ? acoes.agora : acoes.agora.filter(x => !ehAcaoPublica(x));
          const publicas = publicaPrincipal ? [] : acoes.agora.filter(ehAcaoPublica);
          if (div) return (
            <>
              {principais.length > 0 && <AcoesVivas acoes={principais as AcaoProfissional[]} agir={agir} ir={ir} rotulo="O que dá para fazer agora" />}
              {publicas.length > 0 && <p className="ligacao-caminho"><span>Concursos e política ficam em Vida pública.</span> <button type="button" className="link" onClick={() => irPara('vida_publica')}>Ir para Vida pública →</button></p>}
            </>
          );
          return (
            <>
              {principais.length > 0 && <AcoesVivas acoes={principais as AcaoProfissional[]} agir={agir} ir={ir} rotulo="O que dá para fazer agora" />}
              {publicas.length > 0 && (
                <details className="pasta-secao">
                  <summary className="pasta-secao__aba">Vida pública <span className="pasta-secao__conta">{publicas.length === 1 ? '1 possibilidade' : `${publicas.length} possibilidades`}: concursos, política</span></summary>
                  <AcoesVivas acoes={publicas as AcaoProfissional[]} agir={agir} ir={ir} rotulo="Vida pública" />
                </details>
              )}
            </>
          );
        })()}
        {(acoes.mais.length > 0 || acoes.saidas.length > 0) && <Mais mais={div ? acoes.mais.filter(x => !ehAcaoPublica(x)) : acoes.mais} saidas={acoes.saidas} agir={agir} ir={ir} />}
        {modo === 'crianca' && <p className="vazio">Trabalho é proibido antes dos 14. O trabalho agora é crescer.</p>}
      </section>}

      {em('desenvolvimento') && !preso && modo !== 'crianca' && <EmConstrucao vida={vida} lista={construindo} agir={agir} ir={ir} />}

      {em('agora') && <EmParalelo vida={vida} agir={agir} irPara={irPara} modo={modo} divisao={div} />}

      {em('oportunidades') && !preso && <PortasAbertas vida={vida} agir={agir} filtro={ehPortaDeTrabalho} titulo="Portas de trabalho" />}

      {/* REWORK 10.5 · UX-17: o que está em andamento vem antes do que está aberto (a candidatura enviada, o concurso
          esperando o resultado, a seleção em curso) — antes, ficava espalhado pelo estado de cada vaga. */}
      {em('oportunidades') && !preso && <CandidaturasEmAndamento vida={vida} />}
      {em('oportunidades') && !preso && modo !== 'crianca' && (
        <div ref={explorarRef} id="explorar">
          <OutrasPossibilidades vida={vida} agir={agir} aberto={explorar} alternar={() => setExplorar(x => !x)} irPara={irPara} aba={aba} setAba={setAba} ir={ir} fixo={parte === 'oportunidades'} divisao={div} />
        </div>
      )}
      {em('desenvolvimento') && <Devolutivas vida={vida} tipos={div ? ['entrevista'] : undefined} />}
      {em('oportunidades') && <ObjetivosEmCurso vida={vida} agir={agir} filtro={o => !/^(selecao|vestibular):/.test(o.id)} />}
      {em('agora') && <Trajetorias vida={vida} />}
      {/* REWORK 10.6 · C3: Minha carreira — a experiência, os projetos e o reconhecimento de quem já tem uma (antes, na
          divisão, o currículo artístico e a carreira de técnico não apareciam aqui). */}
      {parte === 'historico' && <ExperienciaNaCarreira vida={vida} />}
      {em('historico') && (!div || modo === 'artista') && <CurriculoArtistico vida={vida} agir={agir} />}
      {em('historico') && (!div || modo === 'atleta' || sp.carreira === 'esporte') && <CarreiraNoEsporte vida={vida} aberta={modo === 'atleta' || espSemClube || parte === 'historico'} />}
      {em('historico') && <CarreiraComoTecnico vida={vida} />}
      {/* REWORK 11.5 · TRO-01: a galeria de conquistas (títulos, prêmios, o banco, a arte) — o que ficou registrado. */}
      {em('historico') && <GaleriaDeConquistas vida={vida} />}
      {em('historico') && <MomentosDaCarreira vida={vida} />}
      {em('historico') && (vida.trabalho.historico.length > 0 || vida.caminhos.marcas.length > 0) && <PorOndePassou vida={vida} />}
    </div>
  );
}

/** REWORK 10.5 · UX-17: as candidaturas e seleções em andamento, numa lista só (com quando sai o resultado). */
/**
 * REWORK 10.6 · C3 — as ações principais do trabalho: procurar (ou mudar de) trabalho, as candidaturas e entrevistas, a
 * minha carreira e as outras possibilidades. O rótulo segue a vida: quem tem carreira não lê "procurar o primeiro emprego".
 */
function AcoesPrincipaisDoTrabalho({ vida, irPara }: { vida: Vida; irPara: (a: Aba) => void }) {
  const e = vida.trabalho.atual;
  const modo = modoDoTrabalho(vida);
  const enviadas = vida.anoAtual.acoes.filter(x => x.startsWith('candidatura:')).length + vida.trabalho.candidaturas.length;
  const carreira = !!e && !['aprendiz', 'estagio'].includes(e.contrato);
  const sp = situacaoProfissional(vida);
  const semVinculo = !e && sp.semVinculo;
  // REWORK 11 · QA (D6): para a carreira especial (atleta, comissão técnica, artista, mandato), o emprego comum é outra
  // escolha — "Mudar de trabalho" e "Candidaturas" não são o centro da tela (as candidaturas só aparecem se houver).
  const especial = modo === 'atleta' || modo === 'artista' || modo === 'tecnico' || modo === 'politica';
  const acoes: { id: string; rotulo: string; destino: Aba; nota?: string }[] = [
    { id: 'vagas', rotulo: e && !especial ? 'Mudar de trabalho: ver vagas' : e || semVinculo ? 'Ver outros trabalhos' : vida.trabalho.historico.length ? 'Procurar trabalho' : 'Procurar o primeiro trabalho', destino: 'vagas', nota: semVinculo ? 'a carreira continua sua — outro trabalho é escolha, e a vida pergunta antes' : e && especial ? (modo === 'politica' ? 'o mandato continua — outro trabalho é escolha' : 'a carreira continua sua — mudar é escolha') : undefined },
    ...(especial && !enviadas ? [] : [{ id: 'candidaturas', rotulo: 'Candidaturas e entrevistas', destino: 'vagas' as Aba, nota: enviadas ? `${enviadas} em andamento` : 'nenhuma em andamento' }]),
    { id: 'carreira', rotulo: 'Minha carreira', destino: 'minha_carreira', nota: carreira ? 'experiência, currículo, projetos, reconhecimento' : 'o currículo, por onde você passou' },
    { id: 'outras', rotulo: 'Outras possibilidades', destino: 'negocio', nota: 'por conta, um negócio, um trabalho em paralelo' }
  ];
  return (
    <ul className="acoes-principais acoes-principais--trabalho" aria-label="Ações principais do trabalho">
      {acoes.map(a => (
        <li key={a.id}>
          <button type="button" className="acao-principal" data-acao-principal={a.id} onClick={() => irPara(a.destino)}>
            <span className="acao-principal__rotulo">{a.rotulo}</span>
            {a.nota && <span className="acao-principal__nota">{a.nota}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** A experiência que a carreira acumulou: o trabalho de agora e desde quando, os anos por área, o que já se fez. */
function ExperienciaNaCarreira({ vida }: { vida: Vida }) {
  const e = vida.trabalho.atual;
  const exp = Object.entries(vida.trabalho.experiencia ?? {}).filter(([, m]) => m >= 12).sort((a, b) => b[1] - a[1]).slice(0, 4);
  if (!e && !exp.length && !vida.trabalho.historico.length) return null;
  const anos = (m: number) => { const a = Math.floor(m / 12); return `${a} ${a === 1 ? 'ano' : 'anos'}`; };
  return (
    <section className="experiencia-carreira" aria-labelledby="titulo-experiencia" data-painel="minha-carreira">
      <h2 id="titulo-experiencia" className="secao-fio">A experiência</h2>
      {e && <Linha rotulo="Agora" valor={`${cap(nomeOcupacao(vida, ocupacao(e.ocupacaoId)))}, desde ${anoDe(e.tInicio)}`} />}
      {!e && (() => { const sp = situacaoProfissional(vida); return sp.semVinculo ? <Linha rotulo="Agora" valor={[sp.rotulo, sp.detalhe].filter(Boolean).join(' · ')} /> : null; })()}
      {vida.trabalho.paralela && <Linha rotulo="Em paralelo" valor={cap(nomeOcupacao(vida, ocupacao(vida.trabalho.paralela.ocupacaoId)))} />}
      {exp.map(([trilha, m]) => <Linha key={trilha} rotulo={ROTULO_TRILHA[trilha] ? cap(ROTULO_TRILHA[trilha]) : trilha} valor={anos(m)} />)}
      <Linha rotulo="Trabalhos" valor={String(vida.trabalho.historico.length + (e ? 1 : 0))} />
    </section>
  );
}

function CandidaturasEmAndamento({ vida }: { vida: Vida }) {
  const concursos = vida.trabalho.candidaturas;
  const vagas = vida.anoAtual.acoes.filter(a => a.startsWith('candidatura:')).map(a => ocupacaoOuNula(a.split(':')[1])).filter((x): x is Ocupacao => !!x && !concursos.some(c => c.ocupacaoId === x.id));
  const processo = vida.caminhos.processo?.tipo === 'entrevista' ? vida.caminhos.processo : undefined;
  if (!concursos.length && !vagas.length && !processo) return null;
  return (
    <section className="candidaturas" aria-labelledby="titulo-candidaturas">
      <h2 id="titulo-candidaturas" className="secao-fio">Em andamento</h2>
      <ul className="candidaturas__lista">
        {processo && <li><strong>Seleção{processo.lugar ? ` em ${processo.lugar}` : ''}</strong> <span className="nota">etapa {processo.atual + 1} de {processo.etapas.length}</span></li>}
        {concursos.map(c => { const oc = ocupacaoOuNula(c.ocupacaoId); return <li key={c.id}><strong>{c.concurso ? 'Concurso' : 'Candidatura'}: {oc ? nomeOcupacao(vida, oc) : c.ocupacaoId}</strong> <span className="nota">resultado em {MESES_CURTOS[mesDe(c.tResultado)]} de {anoDe(c.tResultado)}</span></li>; })}
        {vagas.map(oc => { const st = estadoDaVaga(vida, oc); return <li key={oc.id}><strong>{cap(nomeOcupacao(vida, oc))}</strong> <span className="nota">{ROTULO_ESTADO_VAGA[st.estado]} — {st.texto}</span></li>; })}
      </ul>
    </section>
  );
}
const MESES_CURTOS = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];

/**
 * FIX pós-REWORK 4: o miúdo que faz uma carreira por dentro (`noOficio`) — o projeto difícil, a chefia, o colega, a
 * capacitação; a divulgação e o cliente exigente; o treino extra, o vídeo, a fisioterapia, a torcida. Uma vez por ano
 * cada um, com o preço e o risco ditos antes.
 */
function NoDiaADia({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const verbos = verbosDoOficio(vida);
  if (!verbos.length) return null;
  return (
    <div className="dia-a-dia">
      <h3 className="dia-a-dia__titulo">{vida.caminhos.esporte?.fase === 'profissional' && vida.trabalho.atual && ocupacaoOuNula(vida.trabalho.atual.ocupacaoId)?.trilha === 'atleta' ? 'No dia a dia de atleta' : 'No dia a dia do trabalho'}</h3>
      <ul className="dia-a-dia__lista">
        {verbos.map(x => (
          <li key={x.oque} className="dia-a-dia__item">
            <BotaoAcao vida={vida} acao={{ tipo: 'oficio', oque: x.oque }} agir={agir} variante="secundario">{x.rotulo}</BotaoAcao>
            <span className="dia-a-dia__porque">{x.porque}</span>
          </li>
        ))}
      </ul>
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
            {n.equipe!.map(f => { const q = vida.pessoas[f.pessoaId]; return q ? <li key={q.id}><Retrato visual={q.visual} genero={q.genero} idade={idadePessoa(vida, q)} semente={q.id} tamanho={40} especie={q.especie} rotulo={q.nome} /><span>{q.nome}<small>{f.funcao}</small></span></li> : null; })}
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
  // Só o que a conta pessoal cobriu saiu do bolso; o resto o caixa absorveu. (Antes do fechamento, a estimativa: o que o caixa não cobre.)
  const bolso = fechado ? n.devolvidoAno ?? 0 : Math.max(0, -ficou - Math.max(0, n.caixa ?? 0));
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
        <Dado rotulo={ficou >= 0 ? 'Ficou no caixa' : 'Faltou'}>{dinheiroCurto(Math.abs(ficou))}{ficou < 0 ? <small>{bolso > 0 ? ` (${bolso >= -ficou - 50 ? 'saiu do seu bolso' : `${dinheiroCurto(bolso)} saíram do seu bolso; o resto, do caixa`})` : ' (saiu do caixa)'}</small> : <small> (reserva e reinvestimento)</small>}</Dado>
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
        <Dado rotulo="Formalização">{e.mei ? 'MEI: nota fiscal e INSS' : e.contrato === 'informal' ? `informal: sem registro, sem ${previdenciaDaVida(vida).nome}` : 'por conta própria'}</Dado>
        {p?.ativo && <Dado rotulo={p.tipo === 'banda' ? 'A banda' : 'O grupo'}>{p.nome}: {p.publico < 15 ? 'quase ninguém conhece ainda' : p.publico < 40 ? 'já tem quem vá ver' : p.publico < 65 ? 'público fiel na cidade' : 'gente de fora já conhece'}</Dado>}
      </dl>
      {vida.caminhos.palco && <PalcoDoAno vida={vida} />}
      <p className="nota">{estradaNaArea(vida)}</p>
    </section>
  );
}

/**
 * REWORK 10.5 · UX-19 — A CARREIRA DE ATUAÇÃO, sempre na mesma ordem: o resumo (o degrau, o nome, os prêmios, o
 * currículo), o que está em produção, as propostas, o agente e o dinheiro do ano. A carreira cresce (o degrau muda, as
 * produções crescem), mas a tela continua a mesma — não parece outro sistema quando o ator vira ator conhecido.
 */
function PainelCena({ vida }: { vida: Vida }) {
  const e = vida.trabalho.atual!;
  const oc = ocupacao(e.ocupacaoId);
  const av = vida.caminhos.audiovisual;
  const producao = (av?.contratos ?? []).filter(c => c.status === 'em_producao');
  const propostas = (av?.contratos ?? []).filter(c => c.status === 'proposta');
  const premios = (vida.caminhos.curriculo ?? []).filter(x => x.premio?.venceu).length;
  const indicacoes = (vida.caminhos.curriculo ?? []).filter(x => x.premio && !x.premio.venceu).length;
  const cv = leituraDoCurriculo(vida);
  const nome = leituraDoNome(vida);
  const anos = Math.max(0, Math.floor((vida.t - e.tInicio) / 12));
  return (
    <section className="painel painel--cena" aria-label="A carreira de atuação">
      <h3 className="painel-cena__titulo">A carreira</h3>
      <dl className="dados">
        <Dado rotulo="Hoje">{cap(nomeOcupacao(vida, oc))}{anos ? `, há ${anos} ${anos === 1 ? 'ano' : 'anos'}` : ''}</Dado>
        <Dado rotulo="Currículo">{cv.palavra} · {(vida.caminhos.curriculo ?? []).length} {(vida.caminhos.curriculo ?? []).length === 1 ? 'trabalho' : 'trabalhos'}</Dado>
        <Dado rotulo="Para o público">{nome ? nome.palavra : 'ainda pouco conhecido'}</Dado>
        <Dado rotulo="Prêmios">{premios ? `${premios} ${premios === 1 ? 'prêmio' : 'prêmios'}` : 'nenhum ainda'}{indicacoes ? ` · ${indicacoes} ${indicacoes === 1 ? 'indicação' : 'indicações'}` : ''}</Dado>
        <Dado rotulo="Agente">{av?.agente ? `${av.agente.nome} · ${['', 'agência pequena', 'agência média', 'agência grande'][av.agente.rede]}, ${Math.round(av.agente.comissao * 100)}%` : 'sem agente (testes menores, sem comissão)'}</Dado>
      </dl>
      <h3 className="painel-cena__titulo">Em produção</h3>
      {producao.length ? (
        <ul className="painel-cena__lista">{producao.map(c => <li key={c.id}><strong>"{c.titulo}"</strong> <span className="nota">{c.papel} · {c.casa} · até {anoDe(c.tFim ?? vida.t)}</span></li>)}</ul>
      ) : <p className="nota">Nada em produção agora.</p>}
      <h3 className="painel-cena__titulo">Propostas</h3>
      {propostas.length ? (
        <ul className="painel-cena__propostas">
          {propostas.map(c => (
            <li key={c.id} className="ficha-papel" data-proposta={c.id}>
              <p className="ficha-papel__titulo"><strong>"{c.titulo}"</strong>{c.convite ? <span className="ficha-papel__selo"> convite direto</span> : null}{c.continuacaoDe ? <span className="ficha-papel__selo"> continuação</span> : null}</p>
              <dl className="ficha-papel__dados">
                <div><dt>Produção</dt><dd>{NOME_DO_TIPO[c.tipo] ?? c.tipo}{c.genero ? ` · ${c.genero}` : ''} · {c.casa}</dd></div>
                {c.sinopse && <div><dt>Sinopse</dt><dd>{c.sinopse}</dd></div>}
                <div><dt>O papel</dt><dd>{c.papel}{c.personagem ? ` — ${c.personagem}` : ''}</dd></div>
                <div><dt>Tempo</dt><dd>{c.meses ? `${c.meses} ${c.meses === 1 ? 'mês' : 'meses'}${c.integral ? ', dedicação integral' : ', em parte da semana'}` : 'um dia de gravação'}</dd></div>
                <div><dt>Cachê</dt><dd>{contaDoContrato(c)}</dd></div>
                <div><dt>Na carreira</dt><dd>{impactoDoContrato(c)}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
      ) : <p className="nota">Nenhuma proposta aberta. Testes de elenco (e, com nome e prêmios, convites diretos) trazem as próximas.</p>}
      {propostas.length > 0 && <p className="nota">Aceitar, pedir mais ou recusar: em "O que dá para fazer agora".</p>}
      <h3 className="painel-cena__titulo">O dinheiro</h3>
      {vida.caminhos.palco ? <PalcoDoAno vida={vida} /> : <p className="nota">Ainda sem um ano de trabalhos contados.</p>}
    </section>
  );
}

/** O último ano no palco, com cada número pelo nome: o que o contratante paga não é o que fica. */
export function PalcoDoAno({ vida }: { vida: Vida }) {
  const p = vida.caminhos.palco!;
  const rotulo = p.linguagem === 'musica' ? 'shows' : 'apresentações';
  if (p.apresentacoes === 0) return <p className="nota">Em {p.ano}, nenhum {p.linguagem === 'musica' ? 'show' : 'trabalho de palco'} pago: o ano foi de ensaio e espera.</p>;
  return (
    <div className="temporada" aria-label="O palco no último ano">
      <p className="temporada__titulo">O palco em {p.ano}</p>
      <p className="temporada__linha">{p.apresentacoes} {rotulo} · cachê médio do {p.linguagem === 'musica' ? 'show' : 'trabalho'}: {dinheiroCurto(p.cacheMedio)} (valor contratado)</p>
      <p className="nota">Contratado no ano: {dinheiroCurto(p.bruto)}. Custos (equipe, produção, transporte, agência, impostos): {dinheiroCurto(p.custos)}. Ficou para você: {dinheiroCurto(p.artista)} — uns {dinheiroCurto(Math.round(p.artista / 12 / 10) * 10)} por mês, se o ano que vem for igual (e raramente é).</p>
    </div>
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

export function PainelAtleta({ vida }: { vida: Vida }) {
  const es = vida.caminhos.esporte!;
  const i = idade(vida);
  // REWORK 11 · Fase B: o vínculo vem da leitura única — sem emprego de atleta, não há clube atual nem salário de contrato
  // (antes, o clube antigo aparecia como atual, e o salário de OUTRO trabalho aparecia como "salário do contrato").
  const sp = situacaoProfissional(vida);
  const comContrato = sp.carreira === 'esporte' && sp.situacao === 'ativo';
  const salarioDoClube = comContrato ? sp.contrato?.salario ?? vida.trabalho.atual?.salario : undefined;
  const auge = augeDe(vida, es);
  const t = es.temporadas?.[es.temporadas.length - 1];
  const noto = leituraDoNome(vida)?.frase;
  const tenis = es.modalidade === 'tenis';
  // O tênis sobe e desce pelo ranking (a mesma regra do motor); os outros, pelo mercado.
  const oferta = tenis ? circuitoPeloRanking(es.nivel, t?.ranking ?? 2200) : nivelQueOMercadoOferece(vida, es);
  const lesao = lesaoAtiva(vida);
  const individual = perfilDe(es.modalidade).estrutura === 'equipe';
  // O que define a pessoa na modalidade: a posição, a função (e a estatura), a prova, a categoria.
  const prova = individual ? provaDe(vida, es.modalidade) : undefined;
  // REWORK 11: sem clube, o placar diz "sem clube" e o último clube — nunca o antigo como atual.
  const atual = clubeAtual(vida, es);
  const ultimo = atual ? undefined : ultimoClubeDe(es);
  const atributos = es.modalidade === 'futebol' || es.modalidade === 'basquete' ? perfilDeAtributos(vida, es, habilidade(vida, es.modalidade), es.modalidade === 'futebol' ? posicaoDe(vida, es) : undefined, es.modalidade === 'basquete' ? funcaoBasquete(vida) : undefined) : [];
  const papel = es.modalidade === 'basquete' ? ` · ${NOME_FUNCAO[funcaoBasquete(vida)]}, ${estaturaEmPalavras(estatura(vida))}`
    : es.modalidade === 'volei' ? ` · ${NOME_FUNCAO_VOLEI[funcaoVolei(vida)]}, ${estaturaEmPalavras(estatura(vida))}`
      : es.modalidade === 'lutas' ? ` · categoria ${categoriaDeLuta(vida)}` : prova ? ` · ${prova.nome}` : '';
  return (
    <section className="painel painel--atleta" aria-label="A carreira no esporte">
      <div className="placar">
        <span className={`placar__espaco placar__espaco--${es.espaco ?? 'reserva'}`}>{tenis ? 'No circuito' : es.espaco === 'titular' ? 'Titular' : es.espaco === 'reserva' ? 'Reserva' : cap(semVinculo(es.modalidade))}</span>
        <span className="placar__clube">{tenis ? `ranking ${t?.ranking ?? '—'}º` : comContrato ? es.clube : ultimo ? `sem clube · último: ${ultimo.clube} (até ${anoDe(ultimo.ate)})` : sp.ultimoOnde ? `último clube: ${sp.ultimoOnde.nome}` : 'sem clube'}{es.posicao ? ` · ${nomePosicao(vida, es.posicao)}` : ''}{papel}</span>
      </div>
      {atributos.length > 0 && <p className="nota atributos-da-posicao">Na {es.modalidade === 'futebol' ? 'posição' : 'função'}: {atributos.map(a => `${NOME_ATRIBUTO[a.id]} ${Math.round(a.valor)}`).join(' · ')} <small>(o perfil da técnica: pesa na nota e no que a temporada produz)</small></p>}
      {t && (
        <div className="temporada" aria-label="A última temporada">
          <p className="temporada__titulo">Temporada {t.ano} — {t.clube}</p>
          <p className="temporada__linha">{linhaDaTemporada(vida, t)}</p>
          <p className="nota">{palavraDaNota(t.nota).charAt(0).toUpperCase() + palavraDaNota(t.nota).slice(1)}. {tenis ? (t.premio !== undefined ? `Bruto ${dinheiroCurto(t.premio)} − custos do circuito ${dinheiroCurto(t.custos ?? 0)} = ${(t.premio - (t.custos ?? 0)) >= 0 ? '' : '−'}${dinheiroCurto(Math.abs(t.premio - (t.custos ?? 0)))} no ano.` : '') : individual ? (es.espaco === 'titular' ? 'O próximo ano começa nas provas principais da equipe.' : 'O próximo ano começa fora das provas principais da equipe.') : es.espaco === 'titular' ? 'O próximo ano começa como titular.' : 'O próximo ano começa no banco.'}</p>
        </div>
      )}
      {es.totais && es.totais.temporadas >= 2 && !tenis && !individual && (
        <p className="nota carreira-totais">Na carreira: {es.totais.temporadas} temporadas · {es.totais.partidas} jogos{es.modalidade === 'futebol' ? ` · ${es.totais.gols} gols · ${es.totais.assistencias} assistências · ${es.totais.minutos.toLocaleString('pt-BR')} minutos` : ''}{es.transferencias?.length ? (() => { const m = [...es.transferencias].sort((a, b) => b.taxa - a.taxa)[0]; return ` · ${es.transferencias.length} ${es.transferencias.length === 1 ? 'transferência' : 'transferências'} (a maior: ${m.pais ? formatarDinheiroCurto(m.taxa, m.pais) : dinheiroCurto(m.taxa)} entre os clubes, ${m.de} → ${m.para})`; })() : ''}</p>
      )}
      <dl className="dados">
        <Dado rotulo={tenis ? 'Circuito' : comContrato ? 'Divisão (no jogo)' : 'Última divisão'}>{divisaoDe(es.modalidade, es.nivel, paisDaCidade(es.municipioId))}</Dado>
        {tenis
          ? <Dado rotulo="Renda">{salarioDoClube !== undefined ? <>premiação: uns {dinheiroCurto(salarioDoClube)}/mês (a média do último ano), sem salário; treinador e viagens por sua conta</> : 'sem premiação agora: fora do circuito'}</Dado>
          : comContrato
            ? <>
              <Dado rotulo="Contrato">{es.contratoAte ? `até ${anoDe(es.contratoAte)}` : '—'}</Dado>
              {salarioDoClube !== undefined && <Dado rotulo="Salário do contrato">{dinheiroCurto(salarioDoClube)}/mês, bruto</Dado>}
            </>
            : <Dado rotulo="Contrato">nenhum agora{sp.detalhe ? ` (${sp.detalhe})` : ''} — sem salário de clube</Dado>}
        <Dado rotulo="No mercado">{palavraDaReputacao(es.reputacao ?? 30, es.modalidade)}{tenis ? (oferta > es.nivel ? ' · o ranking já dá o circuito acima' : oferta < es.nivel ? ' · o ranking não sustenta este circuito' : '') : oferta > es.nivel ? ' · clubes maiores olham' : oferta < es.nivel ? (oferta === 0 ? ' · sem interesse de outros clubes' : ' · o interesse vem de divisões menores') : ''}</Dado>
        {noto && <Dado rotulo="O público">{noto}</Dado>}
        <Dado rotulo="Treino">{es.foco === 'forcar' ? 'dobrado (evolui e machuca mais)' : es.foco === 'preservar' ? 'poupando o corpo' : tenis ? 'o de sempre, com o seu treinador' : 'o normal do clube'}</Dado>
        <Dado rotulo="O corpo">{lesao ? `${lesao.lesao.parte}${lesao.lesao.cuidado === 'sacrificio' ? ', jogando no sacrifício' : lesao.lesao.cuidado ? `, volta por volta de ${anoDe(lesao.lesao.tFim)}` : ''}` : es.lesoes === 0 ? 'sem lesões sérias' : `${es.lesoes} ${es.lesoes === 1 ? 'lesão' : 'lesões'} na carreira`}</Dado>
        <Dado rotulo="O prazo">{i < auge - 5 ? 'o auge está pela frente' : i <= auge ? 'o auge é agora' : i <= auge + 3 ? 'depois do auge: o rendimento começa a cair' : 'a idade pesa em cada temporada'}</Dado>
      </dl>
      <p className="nota">{tenis ? 'Não há idade para parar: o corpo declina, o ranking mostra, e a conta do circuito diz se ainda fecha. Parar é escolha.' : 'Não há idade para parar: o corpo declina conforme a posição, a temporada mostra, e o mercado decide se ainda há lugar. Parar é escolha.'} {es.modalidade === 'futebol' ? CLUBES_REAIS : ''}</p>
    </section>
  );
}

/** REWORK 11 · Fase B — a frase de quem está numa carreira especial sem contrato (só o que o motor faz de verdade). */
function fraseSemVinculo(sp: SituacaoProfissional): string {
  const d = sp.detalhe ? `${cap(sp.detalhe)}. ` : '';
  if (sp.carreira === 'esporte') return `${d}A carreira continua sua: sem contrato, não há salário de clube — o que vier (um clube, ou o fim da carreira) aparece aqui.`;
  if (sp.carreira === 'tecnico') return `${d}A carreira de técnico continua: proposta de clube ainda pode chegar — anos demais sem banco a encerram.`;
  return `${d}A carreira continua em pausa: voltar é retorno, não recomeço.`;
}

/** REWORK 11 · ESP-11.7 — a comissão técnica: o clube (concreto), a licença de treinador, o comando (se houver). */
export function PainelComissao({ vida }: { vida: Vida }) {
  const e = vida.trabalho.atual;
  if (!e) return null;
  const p = passagemAtual(vida);
  const l = licencaDe(vida);
  return (
    <section className="painel painel--comissao" aria-label="A comissão técnica">
      <dl className="dados">
        <Dado rotulo="Clube">{e.clube ?? e.empregador}{p && !p.selecao ? ` · ${divisaoDoNivel(p.nivel, paisDaCidade(p.municipioId))}` : ''}</Dado>
        <Dado rotulo="Licença de treinador">{l?.nivel ? `licença ${NIVEIS_DE_LICENCA[l.nivel]}` : 'nenhuma ainda'}{l?.emCurso ? ` · cursando a ${NIVEIS_DE_LICENCA[l.emCurso.nivel]} (até ${anoDe(l.emCurso.ate)})` : ''}</Dado>
        {p && <Dado rotulo="O vestiário">{p.vestiario >= 65 ? 'fechado com você' : p.vestiario >= 45 ? 'sem queixas' : 'dividido'}</Dado>}
        {p && <Dado rotulo="A diretoria">{p.pressao >= 70 ? 'o cargo balança' : p.pressao >= 50 ? 'cobrando' : 'tranquila'}</Dado>}
      </dl>
    </section>
  );
}

/** A base: ainda não é emprego — é formação, com rotina de atleta. */
export function PainelBase({ vida }: { vida: Vida }) {
  const es = vida.caminhos.esporte;
  if (!es || es.fase !== 'base') return null;
  const categoria = categoriaDaBase(vida, es);
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
      <p className="painel__frase">{es.modalidade === 'tenis'
        ? `O que pode vir: virar profissional, entre os ${contratoIdade} anos, se os resultados do circuito juvenil sustentarem — sem salário, vivendo de prêmio. Ou a bolsa acaba. O circuito juvenil custa viagem todo ano.`
        : `O que pode vir: um contrato profissional, entre os ${contratoIdade} anos, para quem segue evoluindo — ou a dispensa, que é o destino da maioria. A escola e o resto da semana dividem espaço com o treino.`}</p>
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
      <Horizonte vida={vida} />
    </section>
  );
}

/** O próximo passo da carreira, requisito por requisito — ou, onde não há degrau, a frase do horizonte. */
function Horizonte({ vida }: { vida: Vida }) {
  const pp = proximoPasso(vida);
  if (pp) return <ProximoPassoPainel passo={pp} />;
  const h = horizonte(vida);
  return h ? <p className="painel__frase">{h}</p> : null;
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
      <Horizonte vida={vida} />
      <dl className="dados">
        {servidor && <Dado rotulo="Estabilidade">{anos < 3 ? `estágio probatório até ${anoDe(e.tInicio) + 3}` : 'estável'}</Dado>}
        {proxima && <Dado rotulo="Próxima progressão">{proxima}</Dado>}
        <Dado rotulo="Titulação">{pos.length ? pos.join(', ') : 'graduação'}</Dado>
        {docente && <Dado rotulo="Turmas">{ritmoDe(e) === 'puxado' ? 'carga a mais' : ritmoDe(e) === 'leve' ? 'carga reduzida' : 'a carga de sempre'}</Dado>}
      </dl>
      <Clima vida={vida} />
      <EquipeDoTrabalho vida={vida} />
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
      <Horizonte vida={vida} />
      <p className="nota">{estradaNaArea(vida)}</p>
      <Clima vida={vida} />
      <EquipeDoTrabalho vida={vida} />
    </section>
  );
}

function Clima({ vida }: { vida: Vida }) {
  const c = leituraDoClima(vida);
  if (!c) return null;
  const chefe = chefiaAtual(vida);
  return (
    <p className={`clima clima--${c.tom}`}>
      {chefe && <Retrato visual={chefe.visual} genero={chefe.genero} idade={idadePessoa(vida, chefe)} semente={chefe.id} tamanho={28} especie={chefe.especie} rotulo={chefe.nome} />}
      <span><span className="clima__rotulo">Clima: {c.palavra}.</span> {c.texto}</span>
    </p>
  );
}

/** REWORK 12.3 · E1/E8: a gente do emprego, com nome (a chefia, os colegas, quem responde a você, o mentor, o rival) e as sanções administrativas. */
function EquipeDoTrabalho({ vida }: { vida: Vida }) {
  const eq = leituraDaEquipe(vida);
  const sancoes = vida.trabalho.atual?.sancoes ?? [];
  if (!eq.length && !sancoes.length) return null;
  return (
    <details className="equipe-trabalho">
      <summary>A equipe ({eq.length} {eq.length === 1 ? 'pessoa' : 'pessoas'})</summary>
      <ul className="equipe-trabalho__lista">
        {eq.map(x => <li key={x.id}><strong>{x.nome}</strong> · {x.papel}{x.tensao >= 55 ? ' · clima pesado' : x.proximidade >= 55 ? ' · se dão bem' : ''}</li>)}
      </ul>
      {sancoes.length > 0 && <p className="nota">Na ficha deste emprego (administrativo, não é a Justiça): {sancoes.map(x => `${x.tipo === 'advertencia' ? 'advertência' : 'suspensão'} em ${anoDe(x.t)}`).join('; ')}.</p>}
    </details>
  );
}

export function PainelPolitico({ vida, principal }: { vida: Vida; principal: boolean }) {
  const l = leituraPolitica(vida)!;
  const p = vida.caminhos.politica;
  const m = p?.mandato;
  return (
    <section className={`painel painel--politica${principal ? ' painel--principal' : ''}`} aria-label="A vida política">
      {!principal && <h3 className="painel__titulo">A vida política · {l.titulo}</h3>}
      {m && <Medidor valor={m.aprovacao} rotulo="Aprovação" palavra={l.aprovacao ?? ''} />}
      <dl className="dados">
        {l.partido && <Dado rotulo="Partido">{l.partido}</Dado>}
        {l.publico && <Dado rotulo="Para o público">{l.publico}</Dado>}
        <Dado rotulo="Como político">{l.reputacao}</Dado>
        <Dado rotulo="Base de apoio">{l.apoio}</Dado>
        {l.noPartido && <Dado rotulo="No partido">{l.noPartido}</Dado>}
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

/**
 * REWORK 5 — A PENA COMO CAMADA PRÓPRIA: a situação (regime, tempo cumprido, saída prevista, disciplina, benefícios), o
 * que o pavilhão pede agora (com as respostas), e a rotina de dentro. Tudo lido de `leituraDaPena` (a fonte única).
 */
export function PainelDaPena({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const l = leituraDaPena(vida);
  const t = situacaoNaJustica(vida);
  if (!l) return t ? <section className="painel painel--pena" aria-label="A pena"><p className="painel__frase">{t}</p></section> : null;
  const total = Math.max(1, l.saida - l.inicio);
  const feito = Math.min(100, Math.round(l.cumpridos / total * 100));
  const P = (oque: OquePrisao) => ({ tipo: 'prisao', oque }) as Acao;
  return (
    <section className={`painel painel--pena pena pena--${l.regime}`} aria-label="A pena">
      <dl className="pena__ficha">
        <Dado rotulo="Regime">{l.regime === 'fechado' ? 'Fechado' : 'Semiaberto'}</Dado>
        <Dado rotulo="Desde">{anoDe(l.inicio)}</Dado>
        <Dado rotulo={l.preventiva ? 'Situação' : 'Pena'}>{l.preventiva ? 'Preventiva, à espera do julgamento' : l.pena ? `${Math.round(l.pena / 12)} anos` : '—'}</Dado>
        <Dado rotulo="Saída prevista">{anoDe(l.saida)}</Dado>
        <Dado rotulo="Comportamento"><span className={`pena__disciplina pena__disciplina--${l.disciplina}`}>{l.disciplina}</span></Dado>
      </dl>
      <div className="pena__barra" role="img" aria-label={`${feito}% do tempo até a saída já cumprido`}><span style={{ width: `${feito}%` }} /></div>
      <p className="pena__legenda">{Math.floor(l.cumpridos / 12)} ano{l.cumpridos >= 24 ? 's' : ''} e {l.cumpridos % 12} meses cumpridos{l.remidos ? ` · ${l.remidos} meses remidos` : ''}{l.faccao === 'dentro' ? ' · sob a proteção de um grupo do pavilhão' : ''}</p>
      {l.beneficios.length > 0 && <ul className="pena__beneficios">{l.beneficios.map((b, k) => <li key={k}>{b}</li>)}</ul>}
      {l.situacao && (
        <div className="pena__situacao" role="group" aria-label={l.situacao.titulo}>
          <h3>{l.situacao.titulo}</h3>
          <p>{l.situacao.texto}</p>
          <div className="pena__respostas">{l.situacao.respostas.map(x => <BotaoAcao key={x.oque} vida={vida} agir={agir} acao={P(x.oque)} variante="secundario">{x.rotulo}</BotaoAcao>)}</div>
        </div>
      )}
      <h3 className="pena__subtitulo">A rotina de dentro{l.rotina.length ? ` — você ${l.rotina.join(' e ')}` : ''}</h3>
      <div className="pena__acoes">
        <BotaoAcao vida={vida} agir={agir} acao={P('estudar')} ocultarBloqueado>Estudar na escola da unidade (remição)</BotaoAcao>
        <BotaoAcao vida={vida} agir={agir} acao={P('trabalhar')} ocultarImpossivel>Trabalhar na unidade (remição e pecúlio)</BotaoAcao>
        <BotaoAcao vida={vida} agir={agir} acao={P('visitas')}>Pôr a família na lista de visitas</BotaoAcao>
        <BotaoAcao vida={vida} agir={agir} acao={P('conviver')}>Aproximar-se de alguém do pavilhão</BotaoAcao>
        <BotaoAcao vida={vida} agir={agir} acao={P('cartas')} ocultarImpossivel>Escrever para a família</BotaoAcao>
        <BotaoAcao vida={vida} agir={agir} acao={P('saude')} ocultarImpossivel>Cuidar da saúde (enfermaria, banho de sol)</BotaoAcao>
        <BotaoAcao vida={vida} agir={agir} acao={P('defensoria')} ocultarImpossivel>Pedir à defensoria que reveja a pena</BotaoAcao>
        <BotaoAcao vida={vida} agir={agir} acao={P('preparar_saida')} ocultarImpossivel>Preparar a saída (curso e programa de egressos)</BotaoAcao>
        <BotaoAcao vida={vida} agir={agir} acao={P('fugir')} variante="discreto" mostrarChance>Tentar fugir</BotaoAcao>
      </div>
      {t && <p className="nota">{t}</p>}
    </section>
  );
}

export function PainelForagido({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  return (
    <section className="painel painel--pena pena pena--foragido" aria-label="Foragido">
      <p className="painel__frase">{situacaoDeForagido(vida)}</p>
      <BotaoAcao vida={vida} agir={agir} acao={{ tipo: 'prisao', oque: 'entregar_se' } as Acao}>Entregar-se à Justiça</BotaoAcao>
    </section>
  );
}

/* ============================================================ Em paralelo */

/** O que corre ao lado do trabalho principal: nada disso se perde num campo escondido. */
function EmParalelo({ vida, agir, irPara, modo, divisao }: { vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Aba) => void; modo: ModoTrabalho; divisao?: boolean }) {
  const n = negocioAberto(vida);
  // Sem outro trabalho, o negócio já é a situação de agora (não aparece duas vezes).
  const negocioParalelo = n && !donoIntegral(vida) && modo !== 'negocio' ? n : undefined;
  // Na divisão Trabalho, a base e o grupo moram em Outros caminhos; a política, em Vida pública.
  const base = !divisao && vida.caminhos.esporte?.fase === 'base' && modo !== 'base';
  const pol = !divisao && !!leituraPolitica(vida) && naPolitica(vida) && modo !== 'politica';
  const arte = !divisao && !!vida.caminhos.arte?.ativo && modo !== 'artista';
  const renda = vida.rotinas.map(r => modeloRotina(r.id)).filter(m => m?.categoria === 'renda');
  const porFora = leituraDoEnvolvimento(vida);
  // As outras trajetórias (a paralela, o grupo de fora, as pausadas), cada uma com as próprias ações — nunca misturadas às do trabalho principal.
  const grupos = acoesDasTrajetorias(vida, disponibilidade).filter(g => !divisao || g.id !== 'grupo');
  const grupoArte = grupos.find(g => g.id === 'grupo');
  if (!negocioParalelo && !base && !pol && !arte && !renda.length && !porFora && !grupos.length) return null;
  const acoesNeg = negocioParalelo ? separarNegocio(acoesDoNegocio(vida, disponibilidade)) : undefined;
  return (
    <section className="camada camada--paralelo" aria-labelledby="camada-paralelo">
      <h2 id="camada-paralelo" className="camada__titulo">Em paralelo</h2>
      {negocioParalelo && (
        <div className="paralelo">
          <h3 className="paralelo__titulo">{negocioParalelo.nome}<span> · {negocioParalelo.passivo ? ((negocioParalelo.equipe?.length ?? 0) > 0 ? 'nas mãos da equipe' : 'nas mãos do sócio') : 'nas horas vagas'}</span></h3>
          <PainelNegocio vida={vida} />
          <Renomear vida={vida} agir={agir} alvo="negocio" atual={negocioParalelo.nome} rotulo={`Dar outro nome a ${negocioParalelo.nome}`} />
          {acoesNeg && acoesNeg.agora.length > 0 && <AcoesVivas acoes={acoesNeg.agora} agir={agir} rotulo={`O que fazer por ${negocioParalelo.nome}`} />}
          {acoesNeg && (acoesNeg.mais.length > 0 || acoesNeg.saidas.length > 0) && <Mais mais={acoesNeg.mais} saidas={acoesNeg.saidas} agir={agir} ir={d => irPara(d as Aba)} />}
        </div>
      )}
      {base && <div className="paralelo"><h3 className="paralelo__titulo">{vida.caminhos.esporte!.modalidade === 'futebol' ? 'A base' : 'A equipe'} {doClube(vida.caminhos.esporte!.clube)}</h3><PainelBase vida={vida} /></div>}
      {pol && <div className="paralelo"><PainelPolitico vida={vida} principal={false} /></div>}
      {arte && <div className="paralelo"><h3 className="paralelo__titulo">{vida.caminhos.arte!.nome}<span> · {vida.caminhos.arte!.tipo === 'banda' ? 'a banda' : 'o grupo'}, por fora</span></h3><p className="nota">{vida.caminhos.arte!.publico < 15 ? 'Quase ninguém conhece ainda.' : vida.caminhos.arte!.publico < 40 ? 'Já tem quem vá ver.' : vida.caminhos.arte!.publico < 65 ? 'Público fiel na cidade.' : 'Gente de fora já conhece.'}</p>{grupoArte && <AcoesVivas acoes={grupoArte.acoes} agir={agir} ir={d => irPara(d as Aba)} rotulo={`O que fazer com ${vida.caminhos.arte!.nome}`} />}<Renomear vida={vida} agir={agir} alvo="grupo" atual={vida.caminhos.arte!.nome} rotulo={`Dar outro nome a ${vida.caminhos.arte!.nome}`} /></div>}
      {grupos.filter(g => g.id !== 'grupo').map(g => (
        <div key={g.id} className="paralelo" data-trajetoria={g.id}>
          <h3 className="paralelo__titulo">{g.titulo}</h3>
          {g.subtitulo && <p className="nota">{g.subtitulo}</p>}
          {g.id === 'paralela' && vida.trabalho.paralela && empregoAcademico(vida) === vida.trabalho.paralela && <PainelAcademia vida={vida} />}
          <AcoesVivas acoes={g.acoes} agir={agir} ir={d => irPara(d as Aba)} rotulo={`O que fazer: ${g.titulo}`} />
        </div>
      ))}
      {renda.length > 0 && <div className="paralelo"><h3 className="paralelo__titulo">Por fora</h3><p className="nota">{renda.map(m => m!.nome).join(' · ')} — na sua semana, em <button type="button" className="link" onClick={() => irPara('tempo')}>Minha Semana</button>.</p></div>}
      {porFora && (
        <section className="por-fora" aria-label="Por fora">
          <p className="por-fora__titulo">Por fora</p>
          <p>{porFora}</p>
          <BotaoAcao vida={vida} acao={{ tipo: 'parar_por_fora' }} agir={agir} variante="secundario" ocultarBloqueado>Largar isso de vez</BotaoAcao>
          <button type="button" className="link" onClick={() => irPara('submundo')}>A trajetória inteira, o risco e as saídas — no Submundo →</button>
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

function OutrasPossibilidades({ vida, agir, aberto, alternar, irPara, aba, setAba, ir, fixo, divisao }: { vida: Vida; agir: (a: Acao) => boolean; aberto: boolean; alternar: () => void; irPara: (a: Aba) => void; aba: string; setAba: (a: string) => void; ir: (d: string) => void; fixo?: boolean; divisao?: boolean }) {
  const i = idade(vida);
  // REWORK 9.5 · UX-07: a procura em pastas — Profissões, Vida pública, Negócio próprio, Outras trajetórias (os estudos
  // são o outro lado de Caminhos). Os ids ficam os de antes: a navegação por intenção ('vagas', 'concursos', 'negocio')
  // continua a cair na pasta certa.
  const abas = [
    { id: 'vagas', rotulo: 'Profissões' },
    ...(i >= 16 && !vida.justica?.prisao && !divisao ? [{ id: 'concursos', rotulo: 'Vida pública' }] : []),
    ...(i >= 18 ? [{ id: 'negocio', rotulo: 'Negócio próprio' }] : []),
    ...(i >= 14 && !divisao ? [{ id: 'caminhos', rotulo: 'Outras trajetórias' }] : [])
  ];
  const atual = abas.some(x => x.id === aba) ? aba : 'vagas';
  return (
    <section className="explorar-trabalho camada camada--explorar" aria-labelledby="titulo-explorar">
      {/* Em Caminhos · Oportunidades, a procura é o assunto da aba: aberta, sem botão de recolher. */}
      {fixo
        ? <h2 id="titulo-explorar" className="explorar-trabalho__titulo explorar-trabalho__titulo--fixo"><span>{divisao ? 'Procurar trabalho' : 'Procurar outro caminho'}</span><span className="explorar-trabalho__sub">{divisao ? 'vagas de emprego, trabalhar por conta, abrir o próprio negócio' : 'profissões, vida pública, o próprio negócio, outras trajetórias'}</span></h2>
        : (
          <button type="button" id="titulo-explorar" className="explorar-trabalho__titulo" aria-expanded={aberto} onClick={alternar}>
            <span>Procurar outro caminho</span><span className="explorar-trabalho__sub">profissões, vida pública, o próprio negócio, outras trajetórias</span>
          </button>
        )}
      {aberto && (
        <div className="explorar-trabalho__corpo">
          {divisao && <p className="ligacao-caminho"><span>Concursos ficam em Vida pública; esporte e arte, em Outros caminhos; cursos, em Estudos.</span></p>}
          {abas.length > 1 && <Escolha rotulo="O que procurar" valor={atual} aoMudar={setAba} opcoes={abas} />}
          {atual === 'vagas' && <><Vagas vida={vida} agir={agir} /><OutrosCaminhos vida={vida} agir={agir} irPara={irPara} ir={ir} ids={['por_conta']} titulo="Por conta própria" /></>}
          {atual === 'concursos' && <>{i >= 17 && <Concursos vida={vida} agir={agir} irPara={irPara} />}<OutrosCaminhos vida={vida} agir={agir} irPara={irPara} ir={ir} ids={['publico', 'forcas', 'seguranca', 'politica']} titulo="Carreiras públicas e política" /></>}
          {atual === 'negocio' && <><Negocios vida={vida} agir={agir} /><OutrosCaminhos vida={vida} agir={agir} irPara={irPara} ir={ir} ids={['negocio']} titulo="Como começa" /></>}
          {atual === 'caminhos' && <OutrosCaminhos vida={vida} agir={agir} irPara={irPara} ir={ir} ids={['esporte', 'arte', 'academia']} titulo="Esporte, arte, universidade" estudar />}
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

const TEXTO_BOTAO: Record<string, string> = { por_conta: 'Começar por conta própria', emprego: 'Candidatar-se' };

/**
 * O estado de uma candidatura (REWORK 9.6 · UX-08): candidatar-se não é ser contratado. Lido do estado — as ações do
 * ano, a entrevista aberta, a devolutiva da seleção, o emprego de agora. Nada inventado.
 */
export type EstadoDaVaga = 'pode' | 'conflito' | 'nao_atende' | 'enviada' | 'andamento' | 'contratado' | 'recusado';
export function estadoDaVaga(vida: Vida, oc: Ocupacao, aviso?: string): { estado: EstadoDaVaga; texto: string } {
  const e = vida.trabalho.atual;
  const tentou = vida.anoAtual.acoes.includes(`candidatura:${oc.id}`);
  const devolutiva = [...vida.caminhos.devolutivas].reverse().find(d => d.ocupacaoId === oc.id && d.tipo === 'entrevista' && vida.t - d.t < 12);
  if (e?.ocupacaoId === oc.id) return { estado: 'contratado', texto: `Contratad${vida.eu.genero === 'feminino' ? 'a' : 'o'} — começou em ${anoDe(e.tInicio)}.` };
  if (tentou && vida.momento?.situacaoId === 'trab_entrevista') return { estado: 'andamento', texto: 'Seleção em andamento: a entrevista está acontecendo agora.' };
  if (tentou && devolutiva && !devolutiva.passou) return { estado: 'recusado', texto: `Não foi desta vez. ${devolutiva.texto}` };
  if (tentou) return { estado: 'enviada', texto: porContaPropria(oc) ? 'Você já tentou começar neste ano.' : 'Candidatura enviada neste ano.' };
  const d = disponibilidade(vida, { tipo: 'candidatar', ocupacaoId: oc.id });
  if (!podeTentar(d)) return { estado: 'nao_atende', texto: d.motivo ?? 'Não atende aos requisitos agora.' };
  const conta = porContaPropria(oc);
  if (aviso) return { estado: 'conflito', texto: conta ? 'Pode começar — mas há um conflito, dito acima.' : 'Pode se candidatar — mas há um conflito, dito acima.' };
  return { estado: 'pode', texto: conta ? 'Pode começar quando quiser.' : d.grau === 'improvavel' ? 'Pode se candidatar, com pouca chance.' : 'Pode se candidatar.' };
}

const ROTULO_ESTADO_VAGA: Record<EstadoDaVaga, string> = { pode: 'Aberta para você', conflito: 'Aberta, com conflito', nao_atende: 'Não atende aos requisitos', enviada: 'Candidatura enviada', andamento: 'Seleção em andamento', contratado: 'Contratado', recusado: 'Recusado' };

/**
 * O ANÚNCIO de uma vaga (REWORK 9.6 · UX-08): um documento, lido de cima para baixo — o cargo, quem contrata, onde, a
 * remuneração e as condições, os requisitos (um por linha, com o que você tem), o seu currículo diante dela, os
 * conflitos, os próximos passos e a ação. Uma coluna só, no fluxo do texto: nada posicionado por cima de nada.
 */
export function FichaDaVaga({ vida, oc, motivo, perfil, agir, id }: { vida: Vida; oc: Ocupacao; motivo?: string; perfil?: PerfilVaga; agir: (a: Acao) => boolean; id?: string }) {
  const modelo = modeloDeTrabalho(oc);
  const org = temOrganizacao(oc) ? vagaDaOrganizacao(vida.moradia.municipioId, oc.setor, oc.id, anoDe(vida.t)) : undefined;
  const aviso = avisoDeConflito(vida, oc);
  const est = estadoDaVaga(vida, oc, aviso);
  const reqs = requisitosDaVaga(vida, oc);
  const jornada = [oc.carga === 'parcial' ? 'meio período' : 'período integral', oc.jornada === 'plantao' ? 'plantões (noites e fins de semana)' : oc.jornada === 'longa' ? 'jornada longa' : oc.jornada === 'fora' ? 'dias fora de casa' : ''].filter(Boolean).join(' · ');
  const passos = modelo === 'por_conta'
    ? ['Você começa a atender quando quiser — sem entrevista.', 'A freguesia é que decide: no começo, pouca.']
    : ['A candidatura leva a uma entrevista, logo em seguida.', 'Na entrevista, você escolhe como se apresentar.', 'Passou: começa no emprego. Não passou: a seleção diz o que pesou.'];
  return (
    <article className={`anuncio anuncio--${est.estado}`} aria-labelledby={id}>
      <header className="anuncio__cabeca">
        <p className="anuncio__tipo">{modelo === 'por_conta' ? 'Trabalho por conta própria' : 'Vaga de emprego'} · {ROTULO_SETOR[oc.setor]}</p>
        <h4 id={id} className="anuncio__cargo">{cap(nomeOcupacao(vida, oc))}</h4>
        {org && <p className="anuncio__org">{org.nome}</p>}
        <p className="anuncio__lugar">{nomeLugar(vida.moradia.municipioId)}</p>
      </header>
      <dl className="anuncio__condicoes">
        <div><dt>Remuneração</dt><dd>{modelo === 'por_conta' ? `por volta de ${dinheiroCurto(oc.salario)} por mês, conforme a freguesia` : `${dinheiroCurto(oc.salario)} por mês`}</dd></div>
        <div><dt>Contrato</dt><dd>{ROTULO_MODELO[modelo].explica}</dd></div>
        <div><dt>Jornada</dt><dd>{jornada}</dd></div>
      </dl>
      <section className="anuncio__bloco" aria-label="Requisitos">
        <h5 className="anuncio__rotulo">Requisitos</h5>
        {reqs.length
          ? <ul className="anuncio__requisitos">{reqs.map((r, k) => <li key={k} className={r.ok ? 'anuncio__req anuncio__req--ok' : 'anuncio__req anuncio__req--falta'}><span aria-hidden>{r.ok ? '✓' : '✗'}</span><span className="sr-only">{r.ok ? 'Atende: ' : 'Falta: '}</span>{r.texto}</li>)}</ul>
          : <p className="anuncio__texto">Sem exigência de formação ou experiência.</p>}
      </section>
      {(perfil || motivo) && (
        <section className="anuncio__bloco" aria-label="Compatibilidade">
          <h5 className="anuncio__rotulo">Você diante da vaga</h5>
          {motivo && <p className="anuncio__texto anuncio__texto--porque">{motivo}</p>}
          {perfil && <PerfilDaVaga perfil={perfil} />}
        </section>
      )}
      {!aviso && (() => { const base = notaDaBaseCom(vida, { tipo: 'emprego', ocupacaoId: oc.id, via: 'curriculo' }); return base ? <section className="anuncio__bloco" aria-label="Com a base"><h5 className="anuncio__rotulo">Com a base</h5><p className="anuncio__texto">{base}</p></section> : null; })()}
      {aviso && (
        <section className="anuncio__bloco anuncio__bloco--aviso" aria-label="Conflitos">
          <h5 className="anuncio__rotulo">Conflitos</h5>
          <p className="anuncio__texto">{aviso}</p>
        </section>
      )}
      <section className="anuncio__bloco" aria-label="Próximos passos">
        <h5 className="anuncio__rotulo">Próximos passos</h5>
        <ol className="anuncio__passos">{passos.map((p, k) => <li key={k}>{p}</li>)}</ol>
      </section>
      <footer className="anuncio__rodape">
        <p className={`anuncio__estado anuncio__estado--${est.estado}`}><strong>{ROTULO_ESTADO_VAGA[est.estado]}.</strong> {est.texto}</p>
        {est.estado !== 'contratado' && est.estado !== 'andamento' && <BotaoAcao vida={vida} acao={{ tipo: 'candidatar', ocupacaoId: oc.id }} agir={agir} mostrarChance={modelo !== 'por_conta'}>{TEXTO_BOTAO[modelo] ?? 'Candidatar-se'}</BotaoAcao>}
      </footer>
    </article>
  );
}

/**
 * Uma vaga numa camada (REWORK 4): ESCANEÁVEL primeiro — o cargo, quem contrata, o setor e a cidade, o salário, a
 * compatibilidade numa palavra. Aberta, o ANÚNCIO inteiro (REWORK 9.6), sempre abaixo do resumo, na mesma coluna.
 */
function VagaNaCamada({ vida, x, agir }: { vida: Vida; x: Relevante<Vaga>; agir: (a: Acao) => boolean }) {
  const [aberta, setAberta] = useState(false);
  const oc = x.item.oc;
  const modelo = modeloDeTrabalho(oc);
  const org = temOrganizacao(oc) ? vagaDaOrganizacao(vida.moradia.municipioId, oc.setor, oc.id, anoDe(vida.t)) : undefined;
  const quem = org ? org.nome : modelo === 'por_conta' ? 'por conta própria' : ROTULO_MODELO[modelo].curto;
  const compat = x.item.perfil?.compatibilidade ?? 1;
  return (
    <li className={`vaga-camada vaga-camada--c${compat}${aberta ? ' vaga-camada--aberta' : ''}`}>
      <button type="button" className="vaga-resumo" aria-expanded={aberta} onClick={() => setAberta(a => !a)}>
        <span className="vaga-resumo__cargo">{cap(nomeOcupacao(vida, oc))}</span>
        <span className="vaga-resumo__org">{org ? `${quem} · ${ROTULO_MODELO[modelo].curto}` : quem}</span>
        <span className="vaga-resumo__meta">{ROTULO_SETOR[oc.setor]} · {nomeLugar(vida.moradia.municipioId)}{oc.carga === 'parcial' ? ' · meio período' : ''}</span>
        <span className="vaga-resumo__salario">{modelo === 'por_conta' ? `~${dinheiroCurto(oc.salario)}` : dinheiroCurto(oc.salario)}</span>
        <span className={`vaga-resumo__compat vaga-resumo__compat--${compat}`}>{x.item.perfil?.palavra ?? '—'}</span>
      </button>
      {aberta && <div className="vaga-camada__detalhe"><FichaDaVaga vida={vida} oc={oc} motivo={x.motivo} perfil={x.item.perfil} agir={agir} id={`anuncio-${oc.id}`} /></div>}
    </li>
  );
}

function Vagas({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [todas, setTodas] = useState(false);
  const [maisOutras, setMaisOutras] = useState(false);
  const camadas = useMemo(() => vagasEmCamadas(vida), [vida]);
  const usadas = vida.anoAtual.acoes.filter(a => a.startsWith('candidatura:')).length;
  if (idade(vida) < 14) return null;
  const atual = vida.trabalho.atual?.ocupacaoId;
  const outras = camadas.outras.slice(0, maisOutras ? 12 : 4);
  const vazio = !camadas.trajetoria.length && !camadas.relacionadas.length;
  return (
    <div className="explorar-bloco">
      <p className="dica">Vaga de emprego leva a uma entrevista (até três processos por ano: {Math.max(0, 3 - usadas)} {3 - usadas === 1 ? 'restante' : 'restantes'}). Por conta própria não há entrevista: você começa a atender, e a freguesia é que decide. Abrir um negócio fica na pasta "Negócio próprio".</p>
      {camadas.trajetoria.length > 0 && (
        <BlocoDeVagas titulo="Para você agora" dica="A formação, a estrada recente e o próximo degrau.">
          <ul>{camadas.trajetoria.slice(0, 5).map(x => <VagaNaCamada key={x.item.oc.id} vida={vida} x={x} agir={agir} />)}</ul>
        </BlocoDeVagas>
      )}
      {camadas.relacionadas.length > 0 && (
        <BlocoDeVagas titulo={vazio ? 'Para começar' : 'Outros caminhos ao seu alcance'} dica="Perto do que você já fez: parte da estrada se transfere.">
          <ul>{camadas.relacionadas.slice(0, 5).map(x => <VagaNaCamada key={x.item.oc.id} vida={vida} x={x} agir={agir} />)}</ul>
        </BlocoDeVagas>
      )}
      {camadas.outras.length > 0 && (
        <BlocoDeVagas titulo={vazio ? 'Para começar' : 'Mudar de rumo'} dica={vazio ? 'Nada na sua estrada aponta ainda para um lado: estas são portas de entrada.' : 'Fora da sua trajetória — possíveis, se a vida pedir outra coisa.'}>
          <ul>{outras.map(x => <VagaNaCamada key={x.item.oc.id} vida={vida} x={x} agir={agir} />)}</ul>
          {camadas.outras.length > outras.length && <button type="button" className="dobra__botao" onClick={() => setMaisOutras(true)}>Ver mais {Math.min(8, camadas.outras.length - outras.length)}</button>}
        </BlocoDeVagas>
      )}
      {vagasAcima(vida).length > 0 && (
        <BlocoDeVagas titulo="Acima do seu nível, por enquanto" dica="O que a estrada de agora ainda não alcança — e o que falta.">
          <ul>{vagasAcima(vida).map(({ oc, falta }) => <li key={oc.id} className="vaga-acima"><strong>{nomeOcupacao(vida, oc).charAt(0).toUpperCase() + nomeOcupacao(vida, oc).slice(1)}</strong><span>{ROTULO_SETOR[oc.setor]} · {dinheiroCurto(oc.salario)}</span><span className="nota">{falta}</span></li>)}</ul>
        </BlocoDeVagas>
      )}
      <div className="explorar-todas">
        <button type="button" className="dobra__botao" aria-expanded={todas} onClick={() => setTodas(x => !x)}>{todas ? 'Recolher o catálogo' : 'Explorar tudo (todas as ocupações, com busca e filtros)'}</button>
        {todas && <CatalogoDeVagas vida={vida} agir={agir} atual={atual} />}
      </div>
    </div>
  );
}

/** O catálogo inteiro (terceira camada): todas as ocupações, por família, com o que falta em cada uma. */
function CatalogoDeVagas({ vida, agir, atual }: { vida: Vida; agir: (a: Acao) => boolean; atual?: string }) {
  const itens: ItemCatalogo[] = OCUPACOES.filter(oc => !oc.concurso && oc.id !== atual && oc.entrada !== 'eleicao' && oc.entrada !== 'negocio').map(oc => {
    const d = elegibilidade(vida, oc);
    const pode = podeTentar(d) && oc.entrada !== 'oportunidade';
    const f = familiaDaTrilha(oc.trilha);
    const acima = degrausAcima(oc).slice(0, 2).map(x => nomeOcupacao(vida, x));
    const aviso = pode ? avisoDeConflito(vida, oc) : undefined;
    const modelo = modeloDeTrabalho(oc);
    const tipo = modelo === 'por_conta' ? 'conta' : oc.entrada === 'oportunidade' ? 'oportunidade' : oc.experiencia ? 'estrada' : oc.nivel <= 1 ? 'entrada' : 'emprego';
    const perfil = pode ? perfilParaVaga(vida, oc) : undefined;
    return {
      id: oc.id,
      titulo: nomeOcupacao(vida, oc),
      grupo: f.nome,
      tipo,
      meta: `${ROTULO_MODELO[modelo].curto} · ${ROTULO_SETOR[oc.setor]} · a partir de ${dinheiroCurto(oc.salario)}${oc.carga === 'parcial' ? ' · meio período' : ''}${oc.jornada === 'fora' ? ' · dias fora de casa' : oc.jornada === 'longa' ? ' · jornada longa' : oc.jornada === 'plantao' ? ' · plantões' : ''}`,
      motivo: perfil?.camada === 'trajetoria' ? perfil.porque : undefined,
      destaque: perfil?.camada === 'trajetoria',
      possivel: pode,
      bloqueio: oc.entrada === 'oportunidade' ? 'Não se entra por currículo: chega por uma oportunidade concreta (convite, peneira, contrato). Em "Outros caminhos", como cada uma começa.' : d.motivo,
      busca: `${ROTULO_TRILHA[oc.trilha] ?? ''} ${ROTULO_SETOR[oc.setor]} ${ROTULO_MODELO[modelo].curto}`,
      detalhe: (
        <div className="vaga-detalhe">
          <p className="modelo-trabalho"><strong>{ROTULO_MODELO[modelo].curto[0].toUpperCase() + ROTULO_MODELO[modelo].curto.slice(1)}.</strong> {ROTULO_MODELO[modelo].explica}</p>
          <p><strong>Como se entra:</strong> {f.entrada}.</p>
          {acima.length > 0 && <p><strong>Para onde leva:</strong> {acima.join(', ')}.</p>}
          {f.degraus.length > 0 && <p><strong>Como se cresce:</strong> {f.degraus.join(' → ')}.</p>}
          {(() => { const reqs = requisitosDaVaga(vida, oc); return reqs.length > 0 && <ul className="anuncio__requisitos" aria-label="Requisitos">{reqs.map((r, k) => <li key={k} className={r.ok ? 'anuncio__req anuncio__req--ok' : 'anuncio__req anuncio__req--falta'}><span aria-hidden>{r.ok ? '✓' : '✗'}</span><span className="sr-only">{r.ok ? 'Atende: ' : 'Falta: '}</span>{r.texto}</li>)}</ul>; })()}
          {perfil && <PerfilDaVaga perfil={perfil} />}
          {aviso && <p className="nota nota--atencao"><span aria-hidden>! </span>{aviso}</p>}
        </div>
      ),
      acao: <BotaoAcao vida={vida} acao={{ tipo: 'candidatar', ocupacaoId: oc.id }} agir={agir} mostrarChance={modelo !== 'por_conta'}>{TEXTO_BOTAO[modelo] ?? 'Candidatar-se'}</BotaoAcao>
    };
  });
  return <Catalogo itens={itens} rotulo="Ocupações" dicaBusca="enfermagem, cozinha, motorista, por conta própria…" tipos={[{ id: 'entrada', rotulo: 'Para começar' }, { id: 'emprego', rotulo: 'Vaga de emprego' }, { id: 'estrada', rotulo: 'Pede estrada' }, { id: 'conta', rotulo: 'Por conta própria' }, { id: 'oportunidade', rotulo: 'Por oportunidade' }]} vazio="Nenhuma ocupação com esse filtro." />;
}


export function Concursos({ vida, agir, irPara }: { vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Aba) => void }) {
  const todos = editaisAbertos(vida).map(oc => ({ oc, d: elegibilidade(vida, oc) }));
  const editais = todos.filter(x => podeTentar(x.d));
  // REWORK 12.3 · E10.2: os editais abertos que não cabem no seu perfil, com o requisito que falta (não somem em silêncio).
  const fora = todos.filter(x => !podeTentar(x.d) && x.d.grau !== 'impossivel').slice(0, 8);
  const c = vida.caminhos.concurso;
  const estudando = vida.rotinas.some(r => r.id === 'estudar_concurso');
  const anos = Math.round(c.meses / 12);
  return (
    <div className="explorar-bloco">
      <p className="dica">{estudando ? `Você estuda para concurso${c.meses >= 12 ? ` — o equivalente a ${anos} ${anos === 1 ? 'ano' : 'anos'} de estudo firme` : ''}${c.foco ? `, dirigido para ${NOME_FOCO[c.foco]}` : ', sem uma área'}.` : c.meses >= 6 ? 'Você não estuda agora: o preparo esfria a cada ano parado.' : 'Concurso pede preparo: sem estudo, é quase loteria.'} Aprovado não é empossado: se a posse significar largar alguma coisa, a vida pergunta.</p>
      {/* A preparação (começar, o ritmo, a área, parar) mora nos estudos de agora; aqui, os editais e o preparo de cada um. */}
      <button type="button" className="botao botao--secundario" onClick={() => irPara('estudos')}>{estudando ? 'A preparação, em Caminhos · Estudos' : 'Começar a estudar, em Caminhos · Estudos'} <span aria-hidden>→</span></button>
      {editais.length === 0 && <p className="vazio">Nenhum edital aberto que caiba no seu perfil este ano. Os concursos abrem em anos diferentes.</p>}
      <ul className="lista-vagas">
        {editais.map(({ oc }) => {
          const l = lerPreparo(vida, oc);
          const foco = FOCO_DO_CARGO[oc.id];
          return (
            <li key={oc.id} className="vaga">
              <div className="vaga__texto preparo">
                <strong>{nomeOcupacao(vida, oc)}</strong>
                {(() => { const ed = editalDe(vida, oc); return <span className="preparo__fator">{ed.modalidade === 'processo_seletivo' ? 'Processo seletivo' : 'Concurso'} {NOME_DA_ESFERA[ed.esfera]}: {ed.vagas} {ed.vagas === 1 ? 'vaga' : 'vagas'}, uns {ed.inscritos.toLocaleString('pt-BR')} inscritos ({ed.porVaga} por vaga). Aprovação não é posse: depois vêm a classificação e a convocação.</span>; })()}
                <span className="preparo__palavra">Preparo: {l.palavra}.{foco ? ` Área: ${NOME_FOCO[foco]}.` : ''}</span>
                <span>{l.frase}</span>
                {l.desde && <span className="preparo__fator">{l.desde}</span>}
                {l.fatores.slice(0, 3).map((f, k) => <span key={k} className="preparo__fator">{f}</span>)}
              </div>
              <BotaoAcao vida={vida} acao={{ tipo: 'candidatar', ocupacaoId: oc.id }} agir={agir} mostrarChance>Inscrever-se</BotaoAcao>
            </li>
          );
        })}
      </ul>
      {fora.length > 0 && (
        <details className="concursos-fora">
          <summary>Editais abertos que ainda não cabem no seu perfil ({fora.length})</summary>
          <ul className="lista-simples">{fora.map(({ oc, d }) => <li key={oc.id}><strong>{nomeOcupacao(vida, oc)}</strong>: {d.motivo}</li>)}</ul>
        </details>
      )}
      {vida.caminhos.concurso.reserva && <p className="nota">Cadastro reserva: {nomeOcupacao(vida, ocupacao(vida.caminhos.concurso.reserva.ocupacaoId))}{vida.caminhos.concurso.reserva.posicao ? ` — ${vida.caminhos.concurso.reserva.posicao}º lugar para ${vida.caminhos.concurso.reserva.vagas} vagas` : ''}, até {anoDe(vida.caminhos.concurso.reserva.tAte)}.</p>}
      {vida.trabalho.candidaturas.length > 0 && <p className="nota">Concurso em andamento: {vida.trabalho.candidaturas.map(x => nomeOcupacao(vida, ocupacao(x.ocupacaoId))).join(', ')} — resultado no próximo ano.</p>}
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

/** Por onde se começa cada vida diferente — só as da pasta aberta (`ids`), em fichas compactas. */
export function OutrosCaminhos({ vida, agir, irPara, ir, ids, titulo, estudar }: { vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Aba) => void; ir: (d: string) => void; ids: CaminhoPossivel['id'][]; titulo: string; estudar?: boolean }) {
  const lista = useMemo(() => caminhosPossiveis(vida, disponibilidade).filter(c => ids.includes(c.id)), [vida, ids.join()]);
  return (
    <>
      {lista.length > 0 && <CaminhosPossiveis vida={vida} lista={lista} agir={agir} ir={ir} titulo={titulo} />}
      {estudar && (
        <div className="caminho-politico">
          <h3 className="paralelo__titulo">Estudar para mudar de caminho</h3>
          <p className="caminho-politico__texto">Cursos, faculdade, pós, qualificação — tudo o que abre outras portas está nas oportunidades de formação.</p>
          <button type="button" className="botao botao--discreto" onClick={() => irPara('cursos')}>Ver os cursos →</button>
        </div>
      )}
    </>
  );
}

/* ============================================================ Trajetória */

export function Devolutivas({ vida, tipos }: { vida: Vida; tipos?: Devolutiva['tipo'][] }) {
  const lista = vida.caminhos.devolutivas.filter(d => !d.passou && vida.t - d.t <= 36 && (!tipos || tipos.includes(d.tipo))).slice(-3).reverse();
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

/** A vida acadêmica: a linha, o projeto, a produção (a docência não é só o cargo). */
function PainelAcademia({ vida }: { vida: Vida }) {
  const l = leituraAcademica(vida);
  if (!l) return null;
  return (
    <section className="painel painel--academia" aria-label="A vida acadêmica">
      <dl className="ficha-trabalho">{l.dados.map(([r, t]) => <Dado key={r} rotulo={r}>{t}</Dado>)}</dl>
    </section>
  );
}

/** A trajetória profissional inteira: principal, paralela, pausadas, o que passou (não é um slot só). */
function Trajetorias({ vida }: { vida: Vida }) {
  const linhas = leituraDasTrajetorias(vida);
  if (linhas.length < 2) return null;
  return (
    <Secao titulo="A sua trajetória profissional">
      <ul className="trajetorias">
        {linhas.map((x, k) => <li key={k} className={`trajetoria trajetoria--${x.estado}`}><span className="trajetoria__nome">{x.rotulo}</span><span className="trajetoria__estado">{x.texto}</span></li>)}
      </ul>
    </Secao>
  );
}

/** O currículo artístico: os trabalhos feitos (fictícios, do universo desta vida) — fica depois que a carreira pausa. */
export function CurriculoArtistico({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const c = leituraDoCurriculo(vida);
  const obras = vida.caminhos.obras ?? [];
  if (!c.linhas.length && !obras.length) return null;
  return (
    <Secao titulo={`Currículo artístico · ${c.palavra}`} recolhivel aberta={false}>
      <ul className="marcos-caminho">{c.linhas.map((x, k) => <li key={k}><span>{x}</span></li>)}</ul>
      {obras.length > 0 && (
        <>
          <h3 className="subtitulo">Obras próprias</h3>
          <ul className="marcos-caminho">{obras.slice(-6).map((o, j) => { const k = obras.length - Math.min(6, obras.length) + j; return <li key={k}><span className="marcos-caminho__ano">{anoDe(o.t)}</span><span>"{o.titulo}" {['· passou em branco', '· teve público', '· repercutiu', '· marcou'][o.recepcao]} <Renomear vida={vida} agir={agir} alvo="obra" k={k} atual={o.titulo} rotulo="renomear" /></span></li>; })}</ul>
        </>
      )}
      <p className="nota">Produções e títulos são do universo desta vida.</p>
    </Secao>
  );
}

/**
 * A memória estruturada da carreira esportiva (o palmarés): títulos (com o
 * papel), acessos, prêmios, seleção, marcos — e o histórico por clube. Fica
 * depois que a carreira acaba. A Linha da Vida tem os marcos; aqui, o detalhe.
 */
export function CarreiraNoEsporte({ vida, aberta }: { vida: Vida; aberta: boolean }) {
  // Todas as carreiras esportivas da pessoa (a de agora e as que acabaram antes de uma nova começar).
  const carreiras = carreirasEsportivas(vida).filter(c => c.fase !== 'base' && (c.temporadas?.length ?? 0) > 0);
  const p = leituraDoPalmares(vida);
  const pal = palmaresDe(vida);
  if (!carreiras.length && !p.titulos.length && !p.premios.length) return null;
  const es = vida.caminhos.esporte;
  const futebol = carreiras.some(c => c.modalidade === 'futebol');
  return (
    <Secao titulo={es?.fase === 'encerrada' ? 'A carreira no esporte (encerrada)' : 'A carreira no esporte'} recolhivel aberta={aberta}>
      {/* REWORK 9.6 · VIS-02: a FICHA DO ATLETA — o registro de quem joga (o resumo de cada carreira, títulos, finais,
          prêmios, a seleção). As competições em si são do REWORK 10. */}
      <div className="ficha-atleta papel papel--sem-dobra">
      <p className="ficha-atleta__cabeca"><span>Ficha do atleta</span><span>{vida.eu.nome} {vida.eu.sobrenome}</span></p>
      {carreiras.map((c, k) => <p key={k} className="painel__frase">{carreiras.length > 1 ? `${(NOME_MOD[c.modalidade] ?? c.modalidade).replace(/^./, x => x.toUpperCase())}: ` : ''}{resumoDaCarreira(c)}{p.titulos.length && carreiras.length === 1 ? ` · ${p.titulos.length} ${p.titulos.length === 1 ? 'conquista' : 'conquistas'}` : ''}.</p>)}
      {p.titulos.length > 0 && <div className="palmares__grupo"><h4>Títulos e acessos</h4><ul className="marcos-caminho marcos-caminho--glifos">{p.titulos.slice().reverse().map((x, k) => <li key={k}><GlifoDaLinha palmares={pal} linha={x} padrao="taca" /><span>{x}</span></li>)}</ul></div>}
      {p.finais.length > 0 && <div className="palmares__grupo"><h4>Finais</h4><ul className="marcos-caminho marcos-caminho--glifos">{p.finais.slice().reverse().slice(0, 10).map((x, k) => <li key={k}><GlifoDaLinha palmares={pal} linha={x} padrao="final" /><span>{x}</span></li>)}</ul></div>}
      {p.premios.length > 0 && <div className="palmares__grupo"><h4>Prêmios individuais</h4><ul className="marcos-caminho marcos-caminho--glifos">{p.premios.slice().reverse().map((x, k) => <li key={k}><GlifoDaLinha palmares={pal} linha={x} padrao="premio" /><span>{x}</span></li>)}</ul></div>}
      {p.selecao && <div className="palmares__grupo"><h4>Pelo país</h4><p className="palmares__com-glifo"><GlifoConquista glifo="bandeira" />{p.selecao}</p></div>}
      {p.marcos.length > 0 && <div className="palmares__grupo"><h4>Marcos</h4><ul className="marcos-caminho marcos-caminho--glifos">{p.marcos.slice(-8).reverse().map((x, k) => <li key={k}><GlifoDaLinha palmares={pal} linha={x} padrao="marco" /><span>{x}</span></li>)}</ul></div>}
      {carreiras.map((c, k) => {
        const h = historicoDaCarreira(c);
        if (!h.linhas.length) return null;
        return (
          <div key={k} className="palmares__grupo">
            <h4>{h.agrupado === 'clube' ? (c.modalidade === 'futebol' ? 'Por clube' : 'Por equipe') : 'Ano a ano'}{carreiras.length > 1 ? ` · ${NOME_MOD[c.modalidade] ?? c.modalidade}` : ''}</h4>
            <div className="palmares__historico-rolagem">
              <table className="palmares__historico">
                <thead><tr>{h.colunas.map(col => <th key={col}>{col}</th>)}</tr></thead>
                <tbody>{h.linhas.slice().reverse().map((l, j) => <tr key={j}>{l.map((x, i) => <td key={i}>{celulaDoHistorico(x)}</td>)}</tr>)}</tbody>
              </table>
            </div>
          </div>
        );
      })}
      {futebol && <p className="nota">{CLUBES_REAIS}</p>}
      </div>
    </Secao>
  );
}

/**
 * A carreira de técnico (Carreira de técnico 2.0): a linha da carreira, o
 * clube de agora (a cobrança e o vestiário em palavras, nunca em número), os
 * títulos e a tabela passagem a passagem. Mora ao lado da carreira de
 * jogador — as duas trajetórias, cada uma com a sua tabela.
 */
export function CarreiraComoTecnico({ vida }: { vida: Vida }) {
  const c = vida.caminhos.tecnico;
  if (!c || !c.passagens.length) return null;
  const atual = passagemAtual(vida);
  const res = resumoDoTecnico(c);
  const g = vida.eu.tratamento ?? vida.eu.genero;
  const titulos = c.passagens.flatMap(p => p.temporadas.flatMap(t => (t.titulos ?? []).map(x => `${t.ano} · ${x} — ${p.clube}`)));
  const acessos = c.passagens.flatMap(p => p.temporadas.filter(t => t.acesso).map(t => `${t.ano} · Acesso — ${p.clube}`));
  const pressao = (x: number) => (x < 35 ? 'tranquila' : x < 55 ? 'a de sempre' : x < 72 ? 'cobrança forte' : 'o cargo está ameaçado');
  const vestiario = (x: number) => (x >= 65 ? 'fechado com você' : x >= 45 ? 'sem problemas' : 'dividido');
  const estilo = { ofensivo: 'ofensivo (pressão alta)', defensivo: 'defensivo (contra-ataque)', equilibrado: 'equilibrado' }[c.estilo ?? 'equilibrado'];
  const rotulo = `Carreira como ${g === 'feminino' ? 'técnica' : 'técnico'}`;
  return (
    <div role="region" aria-label={rotulo} className="tecnico">
    <Secao titulo={c.tFim !== undefined ? `${rotulo} (encerrada)` : rotulo} recolhivel aberta={!!atual}>
      <p className="painel__frase tecnico__linha"><strong>{linhaDoTecnico(c)}</strong>{res.jogos ? ` · ${res.aproveitamento}% de aproveitamento` : ''}{res.acessos ? ` · ${res.acessos} ${res.acessos === 1 ? 'acesso' : 'acessos'}` : ''}{res.rebaixamentos ? ` · ${res.rebaixamentos} ${res.rebaixamentos === 1 ? 'rebaixamento' : 'rebaixamentos'}` : ''}{res.demissoes ? ` · ${res.demissoes} ${res.demissoes === 1 ? 'demissão' : 'demissões'}` : ''}.</p>
      {atual && (
        <dl className="ficha-trabalho">
          <Dado rotulo="No comando">{atual.selecao ? atual.clube : `${atual.clube} · ${divisaoDoNivel(atual.nivel, paisDaCidade(atual.municipioId))}`}</Dado>
          <Dado rotulo="Contrato">até {anoDe(atual.contratoAte)}</Dado>
          <Dado rotulo="Diretoria">{pressao(atual.pressao)}</Dado>
          <Dado rotulo="Vestiário">{vestiario(atual.vestiario)}</Dado>
          <Dado rotulo="Jeito de jogar">{estilo}</Dado>
        </dl>
      )}
      {!atual && c.tFim === undefined && <p className="painel__frase">Sem clube desde {anoDe(c.semClubeDesde ?? vida.t)}: o telefone pode tocar.</p>}
      {titulos.length + acessos.length > 0 && <div className="palmares__grupo"><h4>Títulos e acessos</h4><ul className="marcos-caminho">{[...titulos, ...acessos].sort().reverse().map((x, k) => <li key={k}><span>{x}</span></li>)}</ul></div>}
      <div className="palmares__grupo">
        <h4>Por clube</h4>
        <div className="palmares__historico-rolagem">
          <table className="palmares__historico tecnico__passagens">
            <thead><tr><th>Clube</th><th>Período</th><th>J</th><th>V</th><th>E</th><th>D</th><th>Aprov.</th><th>Títulos</th><th>Saída</th></tr></thead>
            <tbody>{[...c.passagens].reverse().map((p, k) => { const r = resumoDaPassagem(p); const pr = periodoDaPassagem(p); return (
              <tr key={k}><td>{p.clube}{p.meioDeTemporada ? <span className="nota"> · assumiu na {p.meioDeTemporada.rodada + 1}ª rodada, em {p.meioDeTemporada.posicao}º</span> : null}</td><td>{pr.de}{p.ate === undefined ? '–' : pr.ate !== pr.de ? `–${pr.ate}` : ''}</td><td>{r.jogos}</td><td>{r.v}</td><td>{r.e}</td><td>{r.d}</td><td>{r.jogos ? `${r.aproveitamento}%` : '—'}</td><td>{r.titulos.length || '—'}</td><td>{comoAcabou(vida, p)}</td></tr>
            ); })}</tbody>
          </table>
        </div>
      </div>
      <p className="nota">{CLUBES_REAIS}</p>
    </Secao>
    </div>
  );
}

/**
 * Os momentos da carreira, POR CARREIRA (REWORK 11 · CAR-11.9): a de agora primeiro, as anteriores depois. Cada uma
 * mistura, em ordem, os marcos automáticos (estreia, transferência, título), as consequências (as cenas que lembram de
 * algo anterior) e as decisões vividas. Antes: as 8 últimas situações de todas as trajetórias misturadas.
 */
const POR_CARREIRA = 12;
function MomentosDaCarreira({ vida }: { vida: Vida }) {
  const grupos = momentosPorCarreira(vida);
  const [todos, setTodos] = useState<Record<string, boolean>>({});
  if (!grupos.length) return null;
  const varias = grupos.length > 1;
  return (
    <Secao titulo="Momentos da carreira" recolhivel aberta={false}>
      {grupos.map(g => {
        const xs = todos[g.trajetoria] ? g.itens : g.itens.slice(0, POR_CARREIRA);
        return (
          <div key={g.trajetoria} className="palmares__grupo">
            {varias && <h4>{g.titulo}{g.atual ? '' : ' · carreira anterior'}</h4>}
            <ul className="momentos-carreira">{xs.map((x, k) => (
              <li key={k} className={x.desfecho ? `momento--${x.desfecho}` : 'momento--bom'}>
                <span className="momentos-carreira__ano">{x.ano}</span>
                <span>{x.tipo === 'marco' ? <span className="nota">marco · </span> : x.tipo === 'consequencia' ? <span className="nota">consequência · </span> : null}{x.intencao && x.tipo !== 'marco' ? <em>{x.intencao.replace(/[.!?]$/, '')}. </em> : null}{x.texto}</span>
              </li>))}</ul>
            {g.itens.length > POR_CARREIRA && !todos[g.trajetoria] && <button type="button" className="botao botao--discreto" onClick={() => setTodos(t => ({ ...t, [g.trajetoria]: true }))}>Ver os {g.itens.length} momentos</button>}
          </div>
        );
      })}
      <p className="nota">A escolha é sua; o que acontece depende do que você construiu — e do dia. Os marcos (estreia, transferências, títulos) o motor registra sozinho.</p>
    </Secao>
  );
}

const DE_CARREIRA = new Set(['primeiro_emprego', 'promocao', 'demissao', 'mudanca_carreira', 'profissional', 'fim_carreira', 'negocio_aberto', 'negocio_fechado', 'aposentadoria', 'transferencia', 'prisao', 'saida_prisao', 'eleicao', 'derrota', 'candidatura', 'lideranca', 'pausa', 'retorno', 'recomeco', 'reserva', 'fim_politica', 'politica']);

/** Os passos da carreira: o trabalho de agora, os empregos que passaram e os marcos de carreira (sem repetir o mesmo fato). */
function passosDaCarreira(vida: Vida, marcos: Vida['caminhos']['marcas']): Passo[] {
  const t = vida.trabalho;
  const out: (Passo & { t: number })[] = [];
  if (t.atual) out.push({ chave: 'atual', t: t.atual.tInicio, quando: `${anoDe(t.atual.tInicio)}–`, texto: `${cap(nomeOcupacao(vida, ocupacao(t.atual.ocupacaoId)))}, ${t.atual.empregador}`, peso: 2, agora: true });
  t.historico.forEach((h, k) => out.push({ chave: `h${k}`, t: h.tInicio, quando: anoDe(h.tFim) !== anoDe(h.tInicio) ? `${anoDe(h.tInicio)}–${String(anoDe(h.tFim)).slice(-2)}` : anoDe(h.tInicio), texto: `${cap(nomeOcupacao(vida, ocupacao(h.ocupacaoId)))}, ${h.empregador}`, peso: 1 }));
  marcos.forEach((m, k) => out.push({ chave: `m${k}`, t: m.t + 0.5, quando: anoDe(m.t), texto: m.texto, peso: m.peso, tipo: 'marco' }));
  return out.sort((a, b) => b.t - a.t);
}

function PorOndePassou({ vida }: { vida: Vida }) {
  const t = vida.trabalho;
  const trilhas = Object.entries(t.experiencia).filter(([, m]) => m >= 12).sort((a, b) => b[1] - a[1]);
  const marcos = vida.caminhos.marcas.filter(m => m.peso === 3 || (m.peso >= 2 && DE_CARREIRA.has(m.tipo))).slice(-10);
  return (
    <Secao titulo="Por onde você passou" recolhivel aberta={t.historico.length + marcos.length > 0}>
      {/* REWORK 9.6 · VIS-02: o CURRÍCULO — a folha com o nome, a idade, a cidade e a formação no alto (os dados da vida),
          a experiência embaixo. O texto é o mesmo de antes; o documento é que é outro. */}
      <div className="curriculo papel">
      <header className="curriculo__cabeca">
        <p className="curriculo__nome">{vida.eu.nome} {vida.eu.sobrenome}</p>
        <p className="curriculo__dados">{idade(vida)} anos · {nomeLugar(vida.moradia.municipioId)}{vida.educacao.concluidos.length ? ` · ${[...vida.educacao.concluidos].sort((a, b) => b.tFim - a.tFim)[0].nome}` : ''}</p>
        <p className="curriculo__rotulo">Experiência profissional</p>
      </header>
      {/* REWORK 7: um percurso só — os empregos (de quando a quando, onde) e os marcos que mudaram o rumo, do mais recente
          ao mais antigo; o trabalho de agora no alto. */}
      <Percurso rotulo="A trajetória profissional" mostrar={6} passos={passosDaCarreira(vida, marcos)} />
      {/* As áreas da carreira, em fases: a mudança não apaga a anterior. */}
      {trajetoriaDeAreas(vida).length > 0 && <p className="nota">Áreas: {trajetoriaDeAreas(vida).map(f => `${f.area} (${anoDe(f.tInicio)}${f.tFim !== undefined ? `–${anoDe(f.tFim)}` : '–hoje'})`).join(' → ')}.</p>}
      {trilhas.length > 0 && <p className="nota">Estrada: {trilhas.map(([tr, m]) => `${Math.floor(m / 12)} ${Math.floor(m / 12) === 1 ? 'ano' : 'anos'} em ${ROTULO_TRILHA[tr] ?? tr}`).join(' · ')}.</p>}
      <p className="nota">{previdenciaDaVida(vida).nome}: {Math.floor(t.contribuicao / 12)} {Math.floor(t.contribuicao / 12) === 1 ? 'ano' : 'anos'} de contribuição.{t.licencas.length ? ` Registros: ${t.licencas.map(l => (l === 'cnh' ? habilitacaoDaVida(vida).regra.nome : nomeDoRegistro(vida, l))).join(', ')}.` : ''}</p>
      </div>
    </Secao>
  );
}

/**
 * Antes dos 14: Trabalho existe (a área não some nem aparece de repente),
 * mas o que há para ver é de onde vem o sustento da casa — e quando a vida
 * profissional começa a ser uma possibilidade.
 */
export function TrabalhoAindaNao({ vida, compacto }: { vida: Vida; irPara: (a: Aba) => void; compacto?: boolean }) {
  const i = idade(vida);
  const casa = leituraDaOrigem(vida);
  const quem = responsaveis(vida).filter(x => x.p.renda > 0 || x.p.ocupacao);
  return (
    <div className="trabalho trabalho--crianca">
      <Folio compacto={compacto} kicker={<><span className="folio__area">Trabalho</span> · ainda não</>} titulo={i < 10 ? 'Trabalho é coisa dos adultos da casa' : 'O trabalho ainda não é seu'} lede={(() => { const lei = regrasDaVida(vida).trabalho; return lei.aprendiz ? `Antes dos ${lei.aprendiz.idade} anos, trabalhar é proibido. Aos ${lei.aprendiz.idade}, abre a porta do ${lei.aprendiz.nome}; aos ${lei.minima}, o primeiro emprego e os bicos.` : `Aqui, trabalhar é proibido antes dos ${lei.minima} anos; aí vêm o primeiro emprego de meio período e os bicos.`; })()} />
      <Secao titulo="Quem sustenta a casa">
        {quem.length ? (
          <ul className="formacao-lista">
            {quem.map(x => <li key={x.p.id}><span className="formacao-lista__nome">{x.p.nome}<span className="formacao-lista__nivel">{x.p.ocupacao ?? 'sem trabalho agora'}</span></span></li>)}
          </ul>
        ) : <p className="nota">Ninguém da casa tem renda agora.</p>}
        <p className="nota">{casa}</p>
      </Secao>
      <p className="nota">Enquanto isso, o que se aprende na escola e no tempo livre vira estrada depois.</p>
    </div>
  );
}
