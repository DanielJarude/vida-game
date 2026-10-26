/**
 * REWORK 12.25 · UI-12.25-01 — O SUBMUNDO NUMA TELA SÓ. Antes, quem tinha anos de histórico via, ao mesmo tempo, "À margem
 * e a Justiça" e "A porta" (a introdução de quem nunca entrou): o processo encerrava o envolvimento, e a tela achava que a
 * pessoa estava "de fora". Agora a tela lê UM estado (`carreiraCriminal.estadoNoSubmundo`: nunca, primeiro contato,
 * ocasional, profissional, de dentro, liderança, saindo, ex — e as condições que se somam: investigado, processado,
 * procurado, foragido, preso) e se organiza em partes, com a divulgação aos poucos:
 *
 *   Visão geral    a situação, o risco e a progressão lado a lado, o que pede atenção, o rumo (escolhido aqui, a qualquer
 *                  hora), o dinheiro do ano por fora, a família
 *   Carreira       o patamar, os marcos, o tempo do ano, as frentes (com as ações e o risco dito antes)
 *   Atividades     as encomendas que chegaram (aceitar, negociar, recusar), as que correm, encomendar a alguém
 *   Contatos       cada pessoa, com o que ela é, quer, deve e lembra — e o que dá para fazer com ela
 *   Organizações   a relação, o posto e a hierarquia, a força, a disputa, o território, o comando
 *   Negócios       os negócios por fora (e a organização própria)
 *   Justiça        a etapa (suspeita → cumprimento), o processo, a estratégia, a audiência, o recurso, o mandado, a pena
 *   Histórico      as anotações, os rumos escolhidos, os marcos, as encomendas que terminaram
 *
 * Quem nunca entrou vê só a porta. Nada aqui ensina coisa alguma: são escolhas e consequências, em palavras.
 */
import { useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { BotaoAcao, Subnav, type ItemDeSubnav } from '../comum';
import { dinheiroCurto } from '../leituraMaterial';
import { anoDe } from '../../motor/tempo';
import { idade } from '../../motor/nucleo';
import { capacidadeDoAno, contasPorFora, estadoNoSubmundo, feitosNoAno, garantirCarreira, leituraDaFamilia, NOME_DA_CONDICAO, NOME_DO_ESTADO, NOME_DO_PATAMAR, patamarAtual, tempoDoCaminho, type FonteDoCrime } from '../../motor/sistemas/carreiraCriminal';
import { leituraDasEncomendas, TIPOS, custoDeDelegar, limiteDeDelegadas } from '../../motor/sistemas/encomendas';
import { acoesComContato, rotuloDaAcaoComContato } from '../../motor/sistemas/redeCriminal';
import { leituraDasOrganizacoes, nomeDaRegiao, regiaoDaPessoa, type OqueOrg } from '../../motor/sistemas/faccoes';
import { etapaAtual, leituraDoProcurado, linhaDaJustica, regrasDoPais, type OqueDefesa } from '../../motor/sistemas/defesa';
import { ROTULO_DO_RUMO, type AcaoDoCrime, type OqueRumo } from '../../motor/sistemas/acoesDoCrime';
import { leituraDaMargem } from '../../motor/sistemas/margem';
import { NOME_DO_PAPEL } from '../../motor/sistemas/submundo';
import { NOME_DO_RAMO } from '../../motor/sistemas/ramos';
import { situacaoNaJustica } from '../../motor/sistemas/justica';
import { FichaDeAntecedentes, FichaDoProcesso } from './Margem';
import { carimboDoCaminho, FrentesDoCaminho, NegociosPorFora } from './Submundo';
import { PainelDaPena } from './Trabalho';
import type { Ramo } from '../../motor/tipos';

type Parte = 'geral' | 'carreira' | 'atividades' | 'contatos' | 'organizacoes' | 'negocios' | 'justica' | 'historico';
const crime = (acao: AcaoDoCrime): Acao => ({ tipo: 'crime', acao });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pct = (x: number) => `${Math.round(x * 100)}%`;

function Medidor({ valor, rotulo, tom }: { valor: number; rotulo: string; tom?: 'risco' | 'progresso' }) {
  return (
    <span className={`svivo-medidor${tom ? ` svivo-medidor--${tom}` : ''}`} role="meter" aria-label={rotulo} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(valor)}>
      <span className="svivo-medidor__cheio" style={{ width: `${Math.max(2, Math.min(100, valor))}%` }} />
    </span>
  );
}

/** A porta (para quem nunca entrou): o que pesa, sem ensinar nada — e o caminho de procurar, se for escolha. */
function APorta({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  return (
    <>
      <section className="divisao__secao submundo__situacao" aria-labelledby="titulo-submundo-situacao">
        <h2 id="titulo-submundo-situacao" className="secao-fio">A situação</h2>
        <p>Nenhum envolvimento: a ficha está limpa e ninguém do meio sabe o seu nome.</p>
      </section>
      {idade(vida) >= 14 && !vida.justica?.prisao && (
        <section className="divisao__secao submundo__porta" aria-labelledby="titulo-submundo-porta">
          <h2 id="titulo-submundo-porta" className="secao-fio">A porta</h2>
          <p className="nota">O crime não tem vaga nem edital: a porta aparece pela vida — a turma, a necessidade, um contato antigo, o acesso a um dinheiro que não é seu — ou quando você a procura. A decisão é sempre sua.</p>
          <div className="grupo-acoes"><BotaoAcao vida={vida} acao={{ tipo: 'margem', oque: 'procurar_contato' }} agir={agir} variante="discreto">Procurar um contato</BotaoAcao></div>
          <ul className="submundo__pesa">
            <li>Dá para começar pequeno, ganhar prática, contatos e nome — e chegar longe: uma organização, um negócio, o comando.</li>
            <li>O dinheiro é incerto, e só uma parte chega à conta; a exposição cresce com o que se faz — e esfria quando se para.</li>
            <li>Investigação não é processo, processo não é condenação, condenação nem sempre é prisão. Mas a conta pode chegar.</li>
            <li>Quem está perto também sente: a família, o trabalho, os amigos. Sair é possível a qualquer momento.</li>
          </ul>
        </section>
      )}
    </>
  );
}

export function SubmundoVivo({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [parte, setParte] = useState<Parte>('geral');
  const est = estadoNoSubmundo(vida);
  const e = vida.caminhos.envolvimento;
  const j = vida.justica;
  if (!e && !j?.processo && !j?.prisao && !j?.foragido && !(j?.antecedentes.length) && !j?.alternativa) return <APorta vida={vida} agir={agir} />;
  const enc = e ? leituraDasEncomendas(vida) : undefined;
  const orgs = e ? leituraDasOrganizacoes(vida) : [];
  const contatos = Object.keys(e?.fichas ?? {}).filter(id => vida.pessoas[id]).length;
  const etapa = etapaAtual(vida);
  const itens: ItemDeSubnav<Parte>[] = [
    { id: 'geral', rotulo: 'Visão geral' },
    ...(e ? [
      { id: 'carreira' as const, rotulo: 'Carreira' },
      { id: 'atividades' as const, rotulo: 'Atividades', conta: (enc?.abertas.length ?? 0) },
      { id: 'contatos' as const, rotulo: 'Contatos', conta: 0, oque: `${contatos} pessoas` },
      { id: 'organizacoes' as const, rotulo: 'Organizações', conta: orgs.filter(o => o.disputa && (o.vinculo === 'integrante' || o.vinculo === 'lideranca')).length },
      { id: 'negocios' as const, rotulo: 'Negócios' }
    ] : []),
    { id: 'justica', rotulo: 'Justiça', conta: etapa && etapa.etapa !== 'suspeita' && etapa.etapa !== 'cumprimento' ? 1 : 0 },
    { id: 'historico', rotulo: 'Histórico' }
  ];
  const atual = itens.some(x => x.id === parte) ? parte : 'geral';
  return (
    <div className="svivo">
      <Situacao vida={vida} ir={setParte} />
      <Subnav rotulo="Partes do Submundo" itens={itens} atual={atual} aoMudar={setParte} prefixo="svivo" classe="svivo__partes" />
      <div role="tabpanel" id="svivo-painel" aria-labelledby={`svivo-aba-${atual}`} className={`svivo__painel svivo__painel--${atual}`} data-parte={atual}>
        {atual === 'geral' && <VisaoGeral vida={vida} agir={agir} />}
        {atual === 'carreira' && <Carreira vida={vida} agir={agir} />}
        {atual === 'atividades' && <Atividades vida={vida} agir={agir} />}
        {atual === 'contatos' && <Contatos vida={vida} agir={agir} />}
        {atual === 'organizacoes' && <Organizacoes vida={vida} agir={agir} />}
        {atual === 'negocios' && <NegociosPorFora vida={vida} agir={agir} ativo={!!e && e.parou === undefined && !j?.prisao} />}
        {atual === 'justica' && <Justica vida={vida} agir={agir} />}
        {atual === 'historico' && <Historico vida={vida} />}
      </div>
      <p className="sr-only" aria-live="polite">{est.titulo}</p>
    </div>
  );
}

/* ================================================================ a situação (o alto da tela) */

function Situacao({ vida, ir }: { vida: Vida; ir: (p: Parte) => void }) {
  const est = estadoNoSubmundo(vida);
  const e = vida.caminhos.envolvimento;
  const p = e ? patamarAtual(vida) : 0;
  const c = e ? garantirCarreira(e) : undefined;
  const enc = e ? leituraDasEncomendas(vida) : undefined;
  const etapa = etapaAtual(vida);
  const disputa = e ? leituraDasOrganizacoes(vida).find(o => o.disputa && (o.vinculo === 'integrante' || o.vinculo === 'lideranca')) : undefined;
  const atencao: { texto: string; parte: Parte }[] = [
    ...(enc && enc.abertas.length ? [{ texto: `${enc.abertas.length === 1 ? 'Uma proposta espera' : `${enc.abertas.length} propostas esperam`} resposta`, parte: 'atividades' as Parte }] : []),
    ...(etapa && etapa.etapa !== 'suspeita' ? [{ texto: etapa.frase, parte: 'justica' as Parte }] : []),
    ...(disputa ? [{ texto: `${cap(disputa.nome)}: a liderança está em disputa`, parte: 'organizacoes' as Parte }] : [])
  ];
  return (
    <section className="svivo-situacao" aria-labelledby="titulo-svivo">
      <header className="svivo-situacao__cabeca">
        <h2 id="titulo-svivo" className="svivo-situacao__titulo">{NOME_DO_ESTADO[est.estado]}</h2>
        <span className="dossie__carimbo">{carimboDoCaminho(vida)}</span>
      </header>
      {est.condicoes.length > 0 && <ul className="svivo-chips" aria-label="O que se soma a isso">{est.condicoes.map(x => <li key={x} className={`svivo-chip svivo-chip--${x}`}>{NOME_DA_CONDICAO[x]}</li>)}</ul>}
      {e && (
        <div className="svivo-duas">
          <div className="svivo-duas__lado">
            <span className="svivo-rotulo">Progressão · {NOME_DO_PATAMAR[p]}</span>
            <Medidor valor={(p + 1) * 20} rotulo={`Patamar: ${NOME_DO_PATAMAR[p]}`} tom="progresso" />
            <span className="svivo-nota">{p < 4 ? `próximo: ${NOME_DO_PATAMAR[p + 1]}` : 'o topo da escala'} · prática {c?.xp ?? 0}</span>
          </div>
          <div className="svivo-duas__lado">
            <span className="svivo-rotulo">Risco · exposição</span>
            <Medidor valor={e.exposicao} rotulo="Exposição às autoridades" tom="risco" />
            <span className="svivo-nota">{e.investigado !== undefined ? 'há uma investigação' : e.exposicao < 25 ? 'pouca gente sabe' : e.exposicao < 55 ? 'gente demais já sabe' : 'é questão de tempo'}</span>
          </div>
        </div>
      )}
      {atencao.length > 0 && (
        <ul className="svivo-atencao" aria-label="Pede atenção">
          {atencao.map((x, k) => <li key={k}><button type="button" className="link" onClick={() => ir(x.parte)}>{x.texto} →</button></li>)}
        </ul>
      )}
    </section>
  );
}

/* ================================================================ visão geral */

const FONTE: Record<FonteDoCrime, string> = { recorrente: 'o que o caminho rendeu', ocasional: 'operações e serviços', negocios: 'negócios por fora', encomendas: 'encomendas', organizacao: 'a parte da organização', investimento: 'posto nos negócios', custos: 'custos do caminho', perdas: 'apreensões, confiscos e multas' };

function VisaoGeral({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const e = vida.caminhos.envolvimento;
  const j = vida.justica;
  const ativo = !!e && e.parou === undefined && !j?.prisao;
  const m = leituraDaMargem(vida);
  const contas = contasPorFora(vida);
  const fam = leituraDaFamilia(vida);
  const procurado = leituraDoProcurado(vida);
  const ult = e?.rumo?.[e.rumo.length - 1];
  const RUMO: Record<string, string> = { parar: 'parar', mudar: 'mudar de cidade', moita: 'ficar na moita', seguir: 'seguir no ritmo', fundo: 'ir mais fundo', sair_aos_poucos: 'sair aos poucos' };
  const linhasContas = (Object.entries(contas.ano) as [FonteDoCrime, number][]).filter(([, x]) => x);
  return (
    <>
      {j?.prisao && <PainelDaPena vida={vida} agir={agir} />}
      {procurado && <Procurado vida={vida} agir={agir} />}
      {m && (
        <section className="svivo-bloco" aria-labelledby="titulo-svivo-caminho">
          <h3 id="titulo-svivo-caminho" className="svivo-bloco__titulo">{m.titulo}</h3>
          <ul className="margem__linhas">{m.linhas.map((l, k) => <li key={k}>{l}</li>)}</ul>
        </section>
      )}
      {ativo && (
        <section className="svivo-bloco" aria-labelledby="titulo-svivo-rumo">
          <h3 id="titulo-svivo-rumo" className="svivo-bloco__titulo">O rumo</h3>
          <p className="svivo-nota">{e!.saindo !== undefined ? `Saindo aos poucos desde ${anoDe(e!.saindo)}: em ${anoDe(e!.saindo + 12)}, se nada mudar, o caminho fica para trás.` : e!.cautela ? 'Na moita: menos dinheiro, menos exposição.' : e!.nivel === 1 ? 'De vez em quando.' : e!.nivel === 2 ? 'Com frequência.' : 'Fundo: um grupo conta com você.'}{ult ? ` A última escolha (${anoDe(ult.t)}): ${RUMO[ult.escolha]}${ult.motivo && ult.motivo !== 'na tela' ? ` — ${ult.motivo.replace(/_/g, ' ')}` : ''}.` : ''}</p>
          <div className="grupo-acoes">
            {(['moita', 'voltar_ritmo', 'fundo', 'sair_aos_poucos', 'desistir_de_sair'] as OqueRumo[]).map(oque => <BotaoAcao key={oque} vida={vida} acao={crime({ area: 'rumo', oque })} agir={agir} variante={oque === 'sair_aos_poucos' ? 'secundario' : 'discreto'} ocultarImpossivel ocultarBloqueado>{ROTULO_DO_RUMO[oque]}</BotaoAcao>)}
            <BotaoAcao vida={vida} acao={{ tipo: 'parar_por_fora' }} agir={agir} variante="principal" ocultarImpossivel>Largar isso de vez</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'margem', oque: 'procurar_ajuda' }} agir={agir} variante="discreto" ocultarImpossivel>Pedir ajuda para sair</BotaoAcao>
            {e!.nivel >= 2 && <BotaoAcao vida={vida} acao={{ tipo: 'margem', oque: 'negociar_saida' }} agir={agir} variante="discreto" ocultarImpossivel>Negociar a saída com o grupo</BotaoAcao>}
          </div>
        </section>
      )}
      {e && e.parou !== undefined && !j?.prisao && (
        <section className="svivo-bloco" aria-labelledby="titulo-svivo-fora">
          <h3 id="titulo-svivo-fora" className="svivo-bloco__titulo">Fora disso</h3>
          <p className="svivo-nota">O passado não some — mas também não manda. Os contatos de antes ainda lembram de você; voltar seria uma escolha.</p>
          <div className="grupo-acoes"><BotaoAcao vida={vida} acao={{ tipo: 'margem', oque: 'procurar_contato' }} agir={agir} variante="discreto" ocultarImpossivel>Procurar os contatos de antes</BotaoAcao></div>
        </section>
      )}
      {(linhasContas.length > 0 || ativo) && (
        <section className="svivo-bloco" aria-labelledby="titulo-svivo-contas">
          <h3 id="titulo-svivo-contas" className="svivo-bloco__titulo">O dinheiro por fora, no último ano</h3>
          {linhasContas.length ? (
            <dl className="svivo-contas">
              {linhasContas.map(([f, x]) => <div key={f}><dt>{cap(FONTE[f])}</dt><dd className={x < 0 ? 'svivo-contas--sai' : undefined}>{x < 0 ? '− ' : '+ '}{dinheiroCurto(Math.abs(x))}</dd></div>)}
              <div className="svivo-contas__total"><dt>No ano</dt><dd>{contas.totalAno < 0 ? '− ' : '+ '}{dinheiroCurto(Math.abs(contas.totalAno))}</dd></div>
            </dl>
          ) : <p className="svivo-nota">Nada entrou nem saiu por fora no último ano fechado.</p>}
          <p className="svivo-nota">Não é salário: varia de um ano para outro. Está no extrato do ano (Vida · Dinheiro), numa linha própria.</p>
        </section>
      )}
      {fam.length > 0 && (
        <section className="svivo-bloco" aria-labelledby="titulo-svivo-familia">
          <h3 id="titulo-svivo-familia" className="svivo-bloco__titulo">A família</h3>
          <ul className="svivo-lista">{fam.map(f => <li key={f.id}><strong>{f.nome}</strong> {f.sabe === 'sabe' ? 'sabe' : 'desconfia'}: {f.postura}.</li>)}</ul>
        </section>
      )}
      {!e && j && <p className="svivo-nota">{situacaoNaJustica(vida) ?? 'O que ficou é a ficha (em Justiça).'}</p>}
    </>
  );
}

function Procurado({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const p = leituraDoProcurado(vida)!;
  return (
    <section className="svivo-bloco svivo-bloco--alerta" aria-labelledby="titulo-svivo-procurado">
      <h3 id="titulo-svivo-procurado" className="svivo-bloco__titulo">{p.titulo}</h3>
      <ul className="svivo-lista">{p.linhas.map((l, k) => <li key={k}>{l}</li>)}</ul>
      <p className="svivo-nota">Chance de ser encontrad{vida.eu.genero === 'feminino' ? 'a' : vida.eu.genero === 'nao_binario' ? 'e' : 'o'} neste ano: <strong>{pct(p.risco)}</strong>.</p>
      <div className="grupo-acoes">
        <BotaoAcao vida={vida} acao={crime({ area: 'justica', oque: 'mudar_endereco' })} agir={agir} variante="secundario" ocultarImpossivel>Mudar de endereço</BotaoAcao>
        <BotaoAcao vida={vida} acao={crime({ area: 'justica', oque: 'abrigo' })} agir={agir} variante="discreto" ocultarImpossivel>Aceitar o abrigo de quem tem presença por aqui</BotaoAcao>
        <BotaoAcao vida={vida} acao={crime({ area: 'justica', oque: 'apresentar_se' })} agir={agir} variante="discreto" ocultarImpossivel>Apresentar-se à Justiça (com um advogado, se der)</BotaoAcao>
        <BotaoAcao vida={vida} acao={{ tipo: 'prisao', oque: 'entregar_se' }} agir={agir} variante="discreto" ocultarImpossivel>Entregar-se à Justiça</BotaoAcao>
      </div>
    </section>
  );
}

/* ================================================================ carreira */

function Carreira({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const e = vida.caminhos.envolvimento!;
  const c = garantirCarreira(e);
  const p = patamarAtual(vida);
  const tempo = tempoDoCaminho(vida);
  return (
    <>
      <section className="svivo-bloco" aria-labelledby="titulo-svivo-patamar">
        <h3 id="titulo-svivo-patamar" className="svivo-bloco__titulo">A escala</h3>
        <ol className="svivo-escada" aria-label="Os patamares do caminho">
          {NOME_DO_PATAMAR.map((n, k) => <li key={n} className={`svivo-escada__degrau${k === p ? ' svivo-escada__degrau--atual' : k < p ? ' svivo-escada__degrau--feito' : ''}`} aria-current={k === p ? 'step' : undefined}>{cap(n)}</li>)}
        </ol>
        <p className="svivo-nota">{['Os trabalhos são pequenos e os ganhos, modestos: é tempo de aprender e de fazer nome.', 'Os contratos melhoram; o meio já conhece você.', 'Gente, negócios e organizações contam com você — e as receitas crescem com isso.', 'Você comanda gente, recursos e decisões: o dinheiro é outro, a responsabilidade também.', 'A escala é a de quem tem muito: as oportunidades são grandes, os riscos também.'][p]}</p>
        {c.principal !== undefined && <p className="svivo-nota"><strong>O crime é a ocupação principal</strong> desde {anoDe(c.principal)}.</p>}
        <p className="svivo-nota">Neste ano: {feitosNoAno(vida)} de {capacidadeDoAno(vida)} trabalhos que cabem na sua semana{tempo ? ` · o caminho ocupa ${tempo.noites} ${tempo.noites === 1 ? 'noite' : 'noites'}${tempo.sabado ? ' e o sábado à tarde' : ''} (Minha semana)` : ''}.</p>
      </section>
      <div className="dossie svivo-dossie"><FrentesDoCaminho vida={vida} agir={agir} /></div>
      {c.marcos.length > 0 && (
        <section className="svivo-bloco" aria-labelledby="titulo-svivo-marcos">
          <h3 id="titulo-svivo-marcos" className="svivo-bloco__titulo">Os marcos</h3>
          <ol className="sub-diario">{c.marcos.slice(-6).reverse().map((x, k) => <li key={k} className="sub-diario--bom"><span className="margem__ano">{anoDe(x.t)}</span> {x.texto}</li>)}</ol>
        </section>
      )}
    </>
  );
}

/* ================================================================ atividades e encomendas */

function Atividades({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const l = leituraDasEncomendas(vida);
  const e = vida.caminhos.envolvimento!;
  const ativos = Object.entries(e.fichas ?? {}).filter(([id, f]) => vida.pessoas[id]?.vivo && f.afastado === undefined && f.traiu === undefined && f.confianca >= 30);
  const [quem, setQuem] = useState<string>(ativos[0]?.[0] ?? '');
  const ramo: Ramo = (e.fichas?.[quem]?.especialidade ?? 'furtos');
  const [tipo, setTipo] = useState<string>(TIPOS[ramo][0].id);
  const tipoValido = TIPOS[ramo].some(x => x.id === tipo) ? tipo : TIPOS[ramo][0].id;
  return (
    <>
      <section className="svivo-bloco" aria-labelledby="titulo-svivo-propostas">
        <h3 id="titulo-svivo-propostas" className="svivo-bloco__titulo">Propostas que chegaram</h3>
        {!l.abertas.length && <p className="svivo-nota">Nenhuma agora. As propostas chegam pelos contatos de confiança, pela organização e pelo nome que você tem no meio — conversar com as pessoas ajuda.</p>}
        <ul className="svivo-cartoes">
          {l.abertas.map(x => (
            <li key={x.id} className={`svivo-cartao svivo-cartao--g${x.gravidade}`}>
              <p className="svivo-cartao__titulo">{cap(x.nome)}</p>
              <p className="svivo-nota">{x.de ? `De ${x.de} · ` : ''}{x.ramo.toLowerCase()} · {['', 'pequeno', 'médio', 'grande'][x.gravidade]} · vale até {anoDe(x.prazo)}</p>
              <dl className="svivo-contas">
                <div><dt>Paga</dt><dd>{dinheiroCurto(x.valor)}</dd></div>
                <div><dt>Chance de dar certo</dt><dd>{pct(x.chance)}</dd></div>
                <div><dt>Se der errado</dt><dd>exposição +{x.risco} (às vezes menos: errar nem sempre aparece)</dd></div>
              </dl>
              <div className="grupo-acoes">
                <BotaoAcao vida={vida} acao={crime({ area: 'encomenda', oque: 'aceitar', id: x.id })} agir={agir} variante="secundario" semAviso>Aceitar</BotaoAcao>
                {!x.negociada && <BotaoAcao vida={vida} acao={crime({ area: 'encomenda', oque: 'negociar', id: x.id })} agir={agir} variante="discreto">Negociar</BotaoAcao>}
                <BotaoAcao vida={vida} acao={crime({ area: 'encomenda', oque: 'recusar', id: x.id })} agir={agir} variante="discreto">Recusar</BotaoAcao>
              </div>
            </li>
          ))}
        </ul>
        <p className="svivo-nota">Neste ano: {feitosNoAno(vida)} de {capacidadeDoAno(vida)} trabalhos que cabem na sua semana.</p>
      </section>
      <section className="svivo-bloco" aria-labelledby="titulo-svivo-encomendar">
        <h3 id="titulo-svivo-encomendar" className="svivo-bloco__titulo">Encomendar a alguém</h3>
        <p className="svivo-nota">Você não precisa fazer tudo: encomendar é pagar adiantado e esperar um ano. Quem faz pode errar — ou sumir com o dinheiro, se não confiar em você. Até {limiteDeDelegadas(vida)} ao mesmo tempo, no seu patamar.</p>
        {l.correndo.length > 0 && <ul className="svivo-lista">{l.correndo.map(x => <li key={x.id}><strong>{cap(x.nome)}</strong>, com {x.de}: {pct(x.chance)} de chance; o resultado chega em {anoDe(x.prazo)}{x.retorno ? ` (pode render ${dinheiroCurto(x.retorno)})` : ''}.</li>)}</ul>}
        {ativos.length > 0 ? (
          <div className="svivo-form">
            <label className="campo"><span className="campo__rotulo">Quem</span>
              <select value={quem} onChange={ev => setQuem(ev.target.value)}>{ativos.map(([id, f]) => <option key={id} value={id}>{vida.pessoas[id].nome} ({NOME_DO_PAPEL[f.papel]}, {NOME_DO_RAMO[f.especialidade].toLowerCase()})</option>)}</select>
            </label>
            <label className="campo"><span className="campo__rotulo">O quê</span>
              <select value={tipoValido} onChange={ev => setTipo(ev.target.value)}>{TIPOS[ramo].map(t => <option key={t.id} value={t.id}>{cap(t.nome)}</option>)}</select>
            </label>
            <BotaoAcao vida={vida} acao={crime({ area: 'encomenda', oque: 'delegar', pessoaId: quem, trabalho: tipoValido })} agir={agir} variante="secundario">{`Encomendar (uns ${dinheiroCurto(custoDeDelegar(vida, tipoValido))} adiantados)`}</BotaoAcao>
          </div>
        ) : <p className="svivo-nota">Ninguém de confiança para isso agora.</p>}
      </section>
      {l.passadas.length > 0 && (
        <details className="svivo-detalhes">
          <summary>O que terminou ({l.passadas.length})</summary>
          <ul className="svivo-lista">{l.passadas.map(x => <li key={x.id}><strong>{cap(x.nome)}</strong>{x.de ? ` (${x.de})` : ''}: {x.resultado ?? (x.estado === 'recusada' ? 'recusada' : x.estado)}</li>)}</ul>
        </details>
      )}
    </>
  );
}

/* ================================================================ contatos */

const INTERESSE: Record<string, string> = { dinheiro: 'quer dinheiro', subir: 'quer subir no meio', sair: 'quer sair disso', familia: 'pensa na família', vinganca: 'tem uma conta a acertar', seguranca: 'quer segurança' };

function Contatos({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const e = vida.caminhos.envolvimento!;
  const xs = Object.entries(e.fichas ?? {}).filter(([id]) => vida.pessoas[id]).map(([id, f]) => ({ id, f, p: vida.pessoas[id], ativo: vida.pessoas[id].vivo && f.afastado === undefined && f.traiu === undefined }))
    .sort((a, b) => Number(b.ativo) - Number(a.ativo) || b.f.confianca - a.f.confianca);
  if (!xs.length) return <p className="svivo-nota">Ninguém do caminho tem ficha ainda.</p>;
  return (
    <ul className="svivo-cartoes">
      {xs.map(({ id, f, p, ativo }) => {
        const org = f.organizacao ? e.organizacoes?.find(o => o.id === f.organizacao)?.nome : undefined;
        const fav = f.favores ?? 0;
        return (
          <li key={id} className={`svivo-cartao${ativo ? '' : ' svivo-cartao--fora'}`}>
            <p className="svivo-cartao__titulo">{p.nome}</p>
            <p className="svivo-nota">{NOME_DO_PAPEL[f.papel]} · {NOME_DO_RAMO[f.especialidade].toLowerCase()}{org ? ` · ${org}` : ''}{!p.vivo ? ' · morreu' : f.traiu !== undefined ? ' · falou demais' : f.afastado !== undefined ? ' · afastou-se' : ''}</p>
            {ativo && (
              <div className="svivo-duas">
                <div className="svivo-duas__lado"><span className="svivo-rotulo">Confiança</span><Medidor valor={f.confianca} rotulo={`Confiança de ${p.nome}`} tom="progresso" /></div>
                <div className="svivo-duas__lado"><span className="svivo-rotulo">Amizade</span><Medidor valor={f.amizade ?? 20} rotulo={`Amizade com ${p.nome}`} tom="progresso" /></div>
              </div>
            )}
            <p className="svivo-nota">
              {fav > 0 ? `Deve ${fav === 1 ? 'um favor' : `${fav} favores`} a você. ` : fav < 0 ? `Você deve ${fav === -1 ? 'um favor' : `${-fav} favores`} a ${p.nome}. ` : ''}
              {f.cumpridas || f.quebradas ? `${f.cumpridas} combinados cumpridos, ${f.quebradas} quebrados. ` : ''}
              {f.interesse ? `Hoje, ${INTERESSE[f.interesse]}.` : ''}
            </p>
            <div className="grupo-acoes">
              {acoesComContato(vida, id).map(oque => <BotaoAcao key={oque} vida={vida} acao={crime({ area: 'contato', oque, pessoaId: id })} agir={agir} variante="discreto" ocultarImpossivel semAviso>{rotuloDaAcaoComContato(oque, f.papel, p.nome)}</BotaoAcao>)}
              {f.quebradas > f.cumpridas && ativo && <BotaoAcao vida={vida} acao={{ tipo: 'submundo', oque: 'cumprir_combinado', pessoaId: id }} agir={agir} variante="discreto" ocultarImpossivel>{`Cumprir o combinado com ${p.nome}`}</BotaoAcao>}
            </div>
            {(f.historia?.length ?? 0) > 0 && <details className="svivo-detalhes"><summary>Entre vocês</summary><ol className="sub-diario">{f.historia!.slice().reverse().map((h, k) => <li key={k} className={h.tom ? `sub-diario--${h.tom}` : undefined}><span className="margem__ano">{anoDe(h.t)}</span> {h.texto}</li>)}</ol></details>}
          </li>
        );
      })}
    </ul>
  );
}

/* ================================================================ organizações */

function Organizacoes({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const os = leituraDasOrganizacoes(vida);
  const reg = regiaoDaPessoa(vida);
  if (!os.length) return <p className="svivo-nota">Nenhuma organização conhecida por aqui.</p>;
  return (
    <>
      <p className="svivo-nota">Você mora em {nomeDaRegiao(vida.moradia.municipioId, reg)}. Aliado não é integrante: trabalha junto, sem ser de dentro.</p>
      <ul className="svivo-cartoes">
        {os.map(o => {
          const A = (oque: OqueOrg, alvo?: string) => crime({ area: 'org', oque, orgId: o.id, alvo });
          const dentro = o.vinculo === 'integrante' || o.vinculo === 'lideranca';
          return (
            <li key={o.id} className={`svivo-cartao svivo-cartao--org${dentro ? ' svivo-cartao--dentro' : ''}`}>
              <p className="svivo-cartao__titulo">{cap(o.nome)}</p>
              <p className="svivo-nota">{o.estilo} · {o.ramo.toLowerCase()}{o.daqui ? '' : ` · ${o.cidade}`} · <strong>{o.nomeVinculo}</strong>{o.estado !== 'ativa' ? ` · ${o.estado === 'extinta' ? 'deixou de existir' : 'enfraquecida'}` : ''}</p>
              <dl className="svivo-contas">
                {o.posto && <div><dt>Seu posto</dt><dd>{o.posto}{o.proximoPosto && dentro && !o.propria ? ` (próximo: ${o.proximoPosto})` : ''}</dd></div>}
                {o.lider && <div><dt>Quem manda</dt><dd>{o.lider}</dd></div>}
                {o.parte ? <div><dt>A sua parte (um ano bom)</dt><dd>uns {dinheiroCurto(o.parte)}</dd></div> : null}
                {o.aliadas.length > 0 && <div><dt>Aliadas</dt><dd>{o.aliadas.join(', ')}</dd></div>}
                {o.rivais.length > 0 && <div><dt>Rivais</dt><dd>{o.rivais.join(', ')}</dd></div>}
              </dl>
              <div className="svivo-tres">
                <div><span className="svivo-rotulo">Força</span><Medidor valor={o.forca} rotulo={`Força de ${o.nome}`} /></div>
                <div><span className="svivo-rotulo">União</span><Medidor valor={o.coesao} rotulo={`Coesão de ${o.nome}`} /></div>
                <div><span className="svivo-rotulo">Pressão da Justiça</span><Medidor valor={o.pressao} rotulo={`Pressão sobre ${o.nome}`} tom="risco" /></div>
                {o.conhecida && <div><span className="svivo-rotulo">Lealdade que leem em você</span><Medidor valor={o.lealdade} rotulo={`Lealdade com ${o.nome}`} tom="progresso" /></div>}
              </div>
              {o.disputa && dentro && (
                <div className="svivo-bloco svivo-bloco--alerta" role="group" aria-label={`A disputa em ${o.nome}`}>
                  <p className="svivo-cartao__titulo">A liderança está em disputa</p>
                  <p className="svivo-nota">{cap(o.disputa.motivo)}. Candidatos: {o.disputa.candidatos.map(c => c.nome).join(', ')}.{o.disputa.apoio ? ` Você apoia ${o.disputa.candidatos.find(c => c.id === o.disputa!.apoio)?.nome}.` : ''}</p>
                  <div className="grupo-acoes">
                    {o.disputa.candidatos.filter(c => c.id !== 'jogador').map(c => <BotaoAcao key={c.id} vida={vida} acao={A('apoiar', c.id)} agir={agir} variante="discreto" ocultarImpossivel>{`Apoiar ${c.nome}`}</BotaoAcao>)}
                    <BotaoAcao vida={vida} acao={A('disputar')} agir={agir} variante="secundario" ocultarImpossivel>Disputar o comando</BotaoAcao>
                    <BotaoAcao vida={vida} acao={A('neutro')} agir={agir} variante="discreto" ocultarImpossivel>Ficar de fora</BotaoAcao>
                  </div>
                </div>
              )}
              <div className="grupo-acoes">
                <BotaoAcao vida={vida} acao={A('conhecer')} agir={agir} variante="discreto" ocultarImpossivel ocultarBloqueado>Procurar saber quem são</BotaoAcao>
                <BotaoAcao vida={vida} acao={A('conversar')} agir={agir} variante="discreto" ocultarImpossivel ocultarBloqueado>Saber como andam as coisas</BotaoAcao>
                <BotaoAcao vida={vida} acao={A('tarefa')} agir={agir} variante="discreto" ocultarImpossivel ocultarBloqueado>Pedir trabalho</BotaoAcao>
                <BotaoAcao vida={vida} acao={A('filiar')} agir={agir} variante="secundario" ocultarImpossivel>Pedir para entrar</BotaoAcao>
                <BotaoAcao vida={vida} acao={A('promocao')} agir={agir} variante="secundario" ocultarImpossivel>Pedir para subir</BotaoAcao>
                <BotaoAcao vida={vida} acao={A('sair')} agir={agir} variante="discreto" ocultarImpossivel>Pedir para sair</BotaoAcao>
              </div>
              {(o.nivel >= 3 || o.propria) && dentro && (
                <details className="svivo-detalhes" open={o.coesao < 45 || o.pressao >= 50}>
                  <summary>O comando{o.prioridade ? ` · prioridade: ${({ expandir: 'crescer', consolidar: 'arrumar a casa', discricao: 'sumir do radar', negocios: 'fazer dinheiro' } as const)[o.prioridade]}` : ''}</summary>
                  <div className="grupo-acoes">
                    <BotaoAcao vida={vida} acao={A('prioridade_expandir')} agir={agir} variante="discreto" ocultarImpossivel ocultarBloqueado>Prioridade: crescer</BotaoAcao>
                    <BotaoAcao vida={vida} acao={A('prioridade_consolidar')} agir={agir} variante="discreto" ocultarImpossivel ocultarBloqueado>Prioridade: arrumar a casa</BotaoAcao>
                    <BotaoAcao vida={vida} acao={A('prioridade_negocios')} agir={agir} variante="discreto" ocultarImpossivel ocultarBloqueado>Prioridade: fazer dinheiro</BotaoAcao>
                    <BotaoAcao vida={vida} acao={A('prioridade_discricao')} agir={agir} variante="discreto" ocultarImpossivel ocultarBloqueado>Prioridade: sumir do radar</BotaoAcao>
                    <BotaoAcao vida={vida} acao={A('mediar')} agir={agir} variante="secundario" ocultarImpossivel>Resolver a briga interna</BotaoAcao>
                    <BotaoAcao vida={vida} acao={A('recolher')} agir={agir} variante="secundario" ocultarImpossivel>Mandar recolher (a pressão está alta)</BotaoAcao>
                    <BotaoAcao vida={vida} acao={A('presenca', reg)} agir={agir} variante="discreto" ocultarImpossivel>{`Fazer-se presente em ${nomeDaRegiao(vida.moradia.municipioId, reg)}`}</BotaoAcao>
                    {os.filter(x => x.id !== o.id && x.daqui && x.estado !== 'extinta').map(x => o.aliadas.includes(x.nome)
                      ? <BotaoAcao key={x.id} vida={vida} acao={A('romper', x.id)} agir={agir} variante="discreto" ocultarImpossivel>{`Romper com ${x.nome}`}</BotaoAcao>
                      : <BotaoAcao key={x.id} vida={vida} acao={A('alianca', x.id)} agir={agir} variante="discreto" ocultarImpossivel>{`Propor aliança a ${x.nome}`}</BotaoAcao>)}
                  </div>
                </details>
              )}
              <details className="svivo-detalhes">
                <summary>A hierarquia, o território e a história</summary>
                <ol className="svivo-escada svivo-escada--org" aria-label={`A hierarquia de ${o.nome}`}>{o.hierarquia.map((h, k) => <li key={h} className={`svivo-escada__degrau${k === o.nivel ? ' svivo-escada__degrau--atual' : k < o.nivel ? ' svivo-escada__degrau--feito' : ''}`}>{cap(h)}</li>)}</ol>
                {o.quadro.length > 0 && <p className="svivo-nota">Gente com nome: {o.quadro.map(q => `${q.nome} (${q.posto})`).join(', ')}.</p>}
                <table className="svivo-territorio">
                  <caption className="sr-only">A presença de {o.nome} em cada região da cidade</caption>
                  <thead><tr><th scope="col">Região</th><th scope="col">Presença</th><th scope="col">Voz de quem mora lá</th></tr></thead>
                  <tbody>{o.territorio.map(t => <tr key={t.id}><th scope="row">{cap(t.nome)}{t.sua ? ' (você mora aqui)' : ''}</th><td><Medidor valor={t.influencia} rotulo={`Presença em ${t.nome}`} /></td><td><Medidor valor={t.comunidade} rotulo={`A voz dos moradores e do comércio em ${t.nome}`} tom="progresso" /></td></tr>)}</tbody>
                </table>
                <p className="svivo-nota">A voz de quem mora lá é a dos moradores e do comércio: quando sobe, cobram o poder público — e quem quer mandar perde espaço.</p>
                {o.lembra.length > 0 && <p className="svivo-nota">Lembram de você: {o.lembra.join('; ')}.</p>}
                {o.historia.length > 0 && <ol className="sub-diario">{o.historia.map((h, k) => <li key={k}><span className="margem__ano">{h.ano}</span> {h.texto}</li>)}</ol>}
              </details>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/* ================================================================ Justiça */

function Justica({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const linha = linhaDaJustica(vida);
  const etapa = etapaAtual(vida);
  const j = vida.justica;
  const regras = regrasDoPais(vida);
  const J = (oque: OqueDefesa) => crime({ area: 'justica', oque });
  return (
    <>
      {linha ? (
        <ol className="svivo-etapas" aria-label="As etapas da Justiça">
          {linha.map(x => <li key={x.etapa} className={`svivo-etapas__etapa svivo-etapas__etapa--${x.estado}`} aria-current={x.estado === 'agora' ? 'step' : undefined}>{x.nome}</li>)}
        </ol>
      ) : <p className="svivo-nota">Nada em andamento na Justiça.</p>}
      {etapa && <p className="svivo-nota"><strong>{etapa.frase}</strong></p>}
      {etapa?.etapa === 'investigacao' && (
        <div className="grupo-acoes"><BotaoAcao vida={vida} acao={J('advogado_cedo')} agir={agir} variante="secundario" ocultarImpossivel>Pôr um advogado para acompanhar desde já</BotaoAcao></div>
      )}
      <FichaDoProcesso vida={vida} agir={agir}>
        <p className="svivo-rotulo">A estratégia</p>
        <div className="grupo-acoes">
          <BotaoAcao vida={vida} acao={J('estrategia_contestar')} agir={agir} variante="discreto" ocultarImpossivel ocultarBloqueado>Contestar as provas</BotaoAcao>
          <BotaoAcao vida={vida} acao={J('estrategia_atenuantes')} agir={agir} variante="discreto" ocultarImpossivel ocultarBloqueado>Mostrar o que atenua (trabalho, família, tempo)</BotaoAcao>
          <BotaoAcao vida={vida} acao={J('estrategia_delegar')} agir={agir} variante="discreto" ocultarImpossivel ocultarBloqueado>Deixar com o advogado</BotaoAcao>
        </div>
        <p className="svivo-rotulo">A audiência</p>
        <div className="grupo-acoes">
          <BotaoAcao vida={vida} acao={J('audiencia_preparar')} agir={agir} variante="secundario" ocultarImpossivel ocultarBloqueado>Preparar-se com a defesa</BotaoAcao>
          <BotaoAcao vida={vida} acao={J('audiencia_comparecer')} agir={agir} variante="discreto" ocultarImpossivel ocultarBloqueado>Comparecer</BotaoAcao>
          <BotaoAcao vida={vida} acao={J('audiencia_faltar')} agir={agir} variante="discreto" ocultarImpossivel ocultarBloqueado>Não ir</BotaoAcao>
        </div>
      </FichaDoProcesso>
      <div className="grupo-acoes">
        <BotaoAcao vida={vida} acao={J('recorrer')} agir={agir} variante="secundario" ocultarImpossivel ocultarBloqueado>Recorrer da condenação</BotaoAcao>
        <BotaoAcao vida={vida} acao={J('abandonar_pena')} agir={agir} variante="discreto" ocultarImpossivel>Deixar de cumprir a pena alternativa</BotaoAcao>
      </div>
      {j?.alternativa && <p className="svivo-nota">A pena alternativa ocupa a manhã de sábado até {anoDe(j.alternativa.tFim)} (Minha semana).</p>}
      {j?.prisao && <PainelDaPena vida={vida} agir={agir} />}
      {j?.foragido && <Procurado vida={vida} agir={agir} />}
      <FichaDeAntecedentes vida={vida} agir={agir} />
      <p className="svivo-nota">As regras daqui: {regras.acordo ? 'há acordo com a acusação' : 'não há acordo com a acusação'}; {regras.fianca ? 'há fiança' : 'não há fiança'}; {regras.colaboracao ? 'a colaboração reduz a pena' : 'a colaboração não reduz a pena'}; a defesa gratuita é {regras.defensoria}. Dinheiro paga advogado, não compra absolvição.</p>
    </>
  );
}

/* ================================================================ histórico */

function Historico({ vida }: { vida: Vida }) {
  const e = vida.caminhos.envolvimento;
  const RUMO: Record<string, string> = { parar: 'parou', mudar: 'mudou de cidade', moita: 'ficou na moita', seguir: 'seguiu no ritmo', fundo: 'foi mais fundo', sair_aos_poucos: 'decidiu sair aos poucos' };
  const diario = (e?.diario ?? []).slice().reverse();
  return (
    <>
      {e?.rumo?.length ? (
        <section className="svivo-bloco" aria-labelledby="titulo-svivo-rumos">
          <h3 id="titulo-svivo-rumos" className="svivo-bloco__titulo">Os rumos escolhidos</h3>
          <ol className="sub-diario">{e.rumo.slice().reverse().map((x, k) => <li key={k}><span className="margem__ano">{anoDe(x.t)}</span> {cap(RUMO[x.escolha] ?? x.escolha)}{x.motivo && x.motivo !== 'na tela' ? ` (${x.motivo.replace(/_/g, ' ')})` : ''}.</li>)}</ol>
        </section>
      ) : null}
      {diario.length > 0 && (
        <section className="svivo-bloco" aria-labelledby="titulo-svivo-anotacoes">
          <h3 id="titulo-svivo-anotacoes" className="svivo-bloco__titulo">Anotações</h3>
          <ol className="sub-diario">{diario.map((d, k) => <li key={k} className={d.tom ? `sub-diario--${d.tom}` : undefined}><span className="margem__ano">{anoDe(d.t)}</span> {d.texto}</li>)}</ol>
        </section>
      )}
      {!diario.length && !e?.rumo?.length && <p className="svivo-nota">Ainda não há história.</p>}
    </>
  );
}
