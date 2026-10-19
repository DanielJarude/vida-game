/**
 * O jogo em andamento.
 *
 * Seis áreas ESTÁVEIS (REWORK 9 — `ui/navegacao`), cada uma respondendo a
 * uma pergunta; o que muda com a idade é o conteúdo e o destaque, não o
 * lugar das coisas:
 *   História       o que aconteceu (a Linha da Vida — o centro)
 *   Você           quem eu sou (corpo, cabeça, humor, aparência e estilo)
 *   Pessoas        com quem vivo e me relaciono
 *   Caminhos       estudos, trabalho e trajetória: Agora · Desenvolvimento · Oportunidades · Histórico
 *   Minha Semana   como organizo o tempo: Agenda · Corpo e mente · Hobbies · Sair · Celular
 *   Vida           a vida concreta: Casa · Dinheiro · Compras · Pertences · Cidade · Viagens
 * Dentro das áreas, seções internas — em vez de mais abas no topo. O painel
 * "Agora" (desktop) diz o que pede atenção, sem repetir as áreas.
 */

import { noticiasDoAno, type Noticia } from '../../motor/sistemas/mundoVivo';
import { BaixarApp } from './BaixarApp';
import { SeletorTema } from '../SeletorTema';
import { Folha } from '../comum';
import { habilitacaoDaVida } from '../../motor/sistemas/autoescola';
import { redeDeSaude } from '../../motor/sistemas/saude';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ControleVida } from '../useVida';
import type { Vida } from '../../motor/tipos';
import { idade, idadePessoa } from '../../motor/nucleo';
import { anoDe, MESES, mesDe } from '../../motor/tempo';
import { municipio, nomeLugar } from '../../motor/dados/lugares';
import { entrarNaVida } from '../../motor/mundo/vida';
import { seguranca } from '../../motor/sistemas/dinheiro';
import { leituraDaSeguranca } from '../leituraMaterial';
import { Retrato } from '../avatar/Retrato';
import { LinhaDaVida } from '../jogo/LinhaDaVida';
import { Momento, Resultado } from '../jogo/Momento';
import { Pessoas } from '../jogo/Pessoas';
import { areaDaPorta } from '../jogo/Estudos';
import { Voce } from '../jogo/Voce';
import { PaginaCaminhos } from '../jogo/CaminhosDaVida';
import { VidaConcreta } from '../jogo/VidaConcreta';
import { expressaoDe, sinalPessoal } from '../estadoPessoal';
import { Fim } from './Fim';
import { RetratoDaVida } from '../jogo/RetratoDaVida';
import { fechamentoDoAno, rotinaDoAno } from '../../motor/sistemas/fechamento';
import { emCasa, sinaisSociais } from '../leitura';
import { doClube } from '../../motor/dados/clubes';
import { AREAS, MAPA_DE_INTENCOES, resolverDestino, rotuloDoLugar, type Aba, type Area, type DivisaoCaminhos, type Lugar, type ParteCaminhos, type SecaoTempo, type SecaoVida } from '../navegacao';

export type { Aba };

function Icone({ d }: { d: string }) {
  return <svg className="icone" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

/** O clima da vida agora (a página perde ou ganha cor). */
export function climaDe(v: Vida): 'dificil' | 'bom' | 'normal' {
  const { felicidade: h, estresse: e } = v.mente;
  if (e >= 72 || h < 32 || v.corpo.saude < 35 || v.justica?.prisao) return 'dificil';
  if (h >= 70 && e < 45) return 'bom';
  return 'normal';
}

export function Jogo({ c }: { c: ControleVida }) {
  const vida = c.vida!;
  const [lugar, setLugar] = useState<Lugar>({ area: 'linha' });
  const [secao, setSecao] = useState<SecaoVida>('casa');
  const [abaTempo, setAbaTempo] = useState<SecaoTempo>('semana');
  // REWORK 9.6: Caminhos lembra a divisão aberta e a parte aberta de cada divisão (voltar é voltar para onde estava).
  const [divisao, setDivisao] = useState<DivisaoCaminhos>('inicio');
  const [partes, setPartes] = useState<Record<'estudos' | 'trabalho', ParteCaminhos>>({ estudos: 'agora', trabalho: 'agora' });
  const parte = divisao === 'estudos' || divisao === 'trabalho' ? partes[divisao] : 'agora';
  const [explorar, setExplorar] = useState<string | undefined>(undefined);
  const foco = useRef<'formacao' | 'trabalho' | undefined>(undefined);
  const [menu, setMenu] = useState(false);
  const [pessoaAberta, setPessoaAberta] = useState<string | null>(null);
  const conteudo = useRef<HTMLElement>(null);
  const fecharMenu = useCallback(() => setMenu(false), []);
  const area = lugar.area;
  const irLugar = (l: Lugar) => {
    if (l.secao) setSecao(l.secao);
    if (l.aba) setAbaTempo(l.aba);
    if (l.area === 'caminhos') {
      // Um destino antigo que só diz a parte (sem a divisão) cai no lado que pede — ou no trabalho.
      const d = l.divisao ?? (l.parte && divisao !== 'estudos' && divisao !== 'trabalho' ? (l.foco === 'formacao' ? 'estudos' : 'trabalho') : undefined);
      if (d) setDivisao(d);
      const alvo = d ?? divisao;
      if (l.parte && (alvo === 'estudos' || alvo === 'trabalho')) setPartes(p => ({ ...p, [alvo]: l.parte! }));
    }
    if (l.explorar) setExplorar(l.explorar);
    foco.current = l.foco;
    setLugar(l);
  };
  const ir = (d: Aba) => irLugar(resolverDestino(d));
  // Tocar em Caminhos estando em Caminhos volta à página inicial dele; vindo de outra área, abre onde estava.
  const irArea = (a: Area) => { if (a === 'caminhos' && area === 'caminhos') irLugar({ area: 'caminhos', divisao: 'inicio' }); else ir(a); };
  const focar = (id: string | null) => { setPessoaAberta(id); c.focarPessoa(id); };
  const abrirPessoa = (id: string | null) => { focar(id); if (id) ir('pessoas'); };

  useEffect(() => {
    conteudo.current?.scrollTo?.({ top: 0 });
    // Em Caminhos, um destino que pede um lado (a formação, o trabalho) leva a ele; o resto começa no alto.
    const lado = foco.current && area === 'caminhos' ? document.querySelector(`.caminhos__painel--ativo [data-lado="${foco.current}"]`) : null;
    if (lado && lado.previousElementSibling) lado.scrollIntoView?.({ block: 'start' }); else window.scrollTo?.({ top: 0 });
  }, [area, secao, abaTempo, parte, divisao]);
  // REWORK 6: depois de viver um ano, a tela vai para a Linha da Vida e mostra O ANO QUE PASSOU — sem jogar o jogador
  // no começo da página nem obrigá-lo a reler a biografia. Se o alto da página já cabe na janela junto com o ano, fica
  // no alto (vê-se também como você está); se não cabe (celular), desce direto até o ano.
  const rolouAte = useRef(0);
  useEffect(() => { if (c.marcaAno > 0) setLugar({ area: 'linha' }); }, [c.marcaAno]);
  // A rolagem espera as decisões e o resultado do ano fecharem (com a folha aberta, a página está travada).
  const livre = !vida.momento && !c.resultado;
  useEffect(() => {
    if (c.marcaAno <= 0 || !livre || rolouAte.current === c.marcaAno) return;
    const id = requestAnimationFrame?.(() => {
      rolouAte.current = c.marcaAno;
      const alvo = document.getElementById('ano-que-passou') ?? document.querySelector('.ano--novo');
      const r = alvo?.getBoundingClientRect?.();
      const suave = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (alvo && r && r.top + window.scrollY > window.innerHeight * 0.45) alvo.scrollIntoView?.({ block: 'start', behavior: suave ? 'smooth' : 'auto' });
      else window.scrollTo?.({ top: 0 });
    });
    return () => { if (id) cancelAnimationFrame?.(id); };
  }, [c.marcaAno, livre]);

  if (vida.morte) return <Fim vida={vida} c={c} />;
  const i = idade(vida);
  // A tela fala na moeda do país onde a vida está (o motor faz o mesmo ao processar a vida).
  entrarNaVida(vida);
  const m = municipio(vida.moradia.municipioId);

  return (
    <div className="jogo" data-clima={climaDe(vida)}>
      <header className="cabecalho">
        <button type="button" className="marca" onClick={() => setMenu(true)} aria-label="Menu">VIDA</button>
        <nav className="abas" aria-label="Áreas">
          {AREAS.map(a => (
            <button key={a.id} type="button" className={`aba aba--${a.id}${area === a.id ? ' aba--ativa' : ''}`} aria-label={a.rotulo} aria-current={area === a.id ? 'page' : undefined} onClick={() => irArea(a.id)}>
              <Icone d={a.icone} /><span>{a.rotulo}</span>
            </button>
          ))}
        </nav>
        <button type="button" className="cabecalho__eu" onClick={() => ir('voce')} aria-label={`${vida.eu.nome}, ${i} anos: ver como você está`}>
          <Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? "eu"} tamanho={36} rotulo={vida.eu.nome} expressao={expressaoDe(vida)} />
          <span className="cabecalho__eu-texto">
            <strong>{vida.eu.nome}, {i} {i === 1 ? 'ano' : 'anos'}</strong>
            <span>{anoDe(vida.t)} · {nomeLugar(m.id)}</span>
          </span>
        </button>
      </header>

      <div className={`palco palco--${area}`}>
        <main className={`conteudo pagina pagina--${area}${area === 'vida' ? ` pagina--vida-${secao}` : ''}`} ref={conteudo}>
          {area === 'linha' && <><RetratoDaVida vida={vida} irPara={ir} abrirPessoa={abrirPessoa} />{c.marcaAno > 0 && <AnoQuePassou vida={vida} desde={c.marcaAno} abrirPessoa={abrirPessoa} />}<LinhaDaVida vida={vida} marca={c.marcaAno} abrirPessoa={abrirPessoa} /></>}
          {area === 'voce' && <Voce vida={vida} agir={c.agir} irPara={ir} abrirPessoa={abrirPessoa} />}
          {area === 'pessoas' && <Pessoas vida={vida} agir={c.agir} aberta={pessoaAberta} abrir={focar} />}
          {area === 'caminhos' && <PaginaCaminhos vida={vida} agir={c.agir} irPara={ir} abrirPessoa={abrirPessoa} divisao={divisao} irDivisao={(d, p) => irLugar({ area: 'caminhos', divisao: d, parte: p })} parte={parte} irParte={p => irLugar({ area: 'caminhos', divisao, parte: p })} explorar={explorar} aoExplorar={setExplorar} />}
          {area === 'tempo' && <Tempo vida={vida} agir={c.agir} irPara={ir} aba={abaTempo} irAba={a => ir(a)} abrirPessoa={abrirPessoa} />}
          {area === 'vida' && <VidaConcreta vida={vida} agir={c.agir} secao={secao} irSecao={s => ir(s)} irPara={ir} abrirPessoa={abrirPessoa} />}
          {/* FIX pós-playtest humano: "Viver mais um ano" é "terminei o que queria fazer neste ano" — mora no FIM da
              página, depois de tudo o que dá para ver e fazer nela; nunca por cima do conteúdo. */}
          <div className="avancar">
            <button type="button" className="avancar__botao" onClick={c.avancar} disabled={!!vida.momento}>
              <span className="avancar__rotulo">Viver mais um ano</span>
              <span className="avancar__idade">{i} → {i + 1}</span>
            </button>
          </div>
        </main>

        <aside className="agora" aria-label="Agora">
          <Agora vida={vida} area={area} irPara={ir} abrirPessoa={abrirPessoa} />
        </aside>
      </div>

      <nav className={`barra barra--${AREAS.length}`} aria-label="Áreas">
        {AREAS.map(a => (
          <button key={a.id} type="button" className={`barra__item barra__item--${a.id}${area === a.id ? ' barra__item--ativo' : ''}`} aria-current={area === a.id ? 'page' : undefined} onClick={() => irArea(a.id)}>
            <Icone d={a.icone} /><span>{a.curto}</span>
          </button>
        ))}
      </nav>

      {vida.momento && <Momento vida={vida} agir={c.agir} />}
      {!vida.momento && c.resultado && <Resultado titulo={c.resultado.titulo} texto={c.resultado.texto} aoFechar={c.fecharResultado} vida={vida} pessoaId={c.resultado.pessoaId} mudancas={c.resultado.mudancas} />}
      {menu && <Menu c={c} aoFechar={fecharMenu} ir={l => { irLugar(l); setMenu(false); }} />}
    </div>
  );
}

const ROTULO_NOTICIA: Record<Noticia['categoria'], string> = { pessoas: 'Pessoas', familia: 'Família', trabalho: 'Trabalho', cidade: 'A cidade', portas: 'Uma porta', vida: 'Pessoas' };

/**
 * REWORK 5 — "Enquanto isso": o que o MUNDO fez no ano que passou, sem o jogador escolher (`mundoVivo.noticiasDoAno`,
 * lido da Linha da Vida — uma fonte só). Ano tranquilo não inventa notícia: a seção some.
 */
function EnquantoIsso({ vida, desde, abrirPessoa }: { vida: Vida; desde: number; abrirPessoa: (id: string) => void }) {
  const ns = noticiasDoAno(vida, desde);
  if (!ns.length) return null;
  return (
    <section className="enquanto" aria-label="Enquanto isso">
      <h2 className="enquanto__titulo">Enquanto isso</h2>
      <ul className="enquanto__lista">
        {ns.map((n, k) => {
          const p = n.pessoas.map(id => vida.pessoas[id]).find(x => x && vida.vinculos[x.id]);
          return (
            <li key={k} className={`enquanto__item enquanto__item--${n.categoria}${n.tom ? ` enquanto__item--${n.tom}` : ''}`}>
              <span className="enquanto__tipo">{ROTULO_NOTICIA[n.categoria]}</span>
              <span className="enquanto__texto">{n.texto}</span>
              {p && <button type="button" className="enquanto__pessoa" onClick={() => abrirPessoa(p.id)}>Ver {p.nome}</button>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * REWORK 6 — o ano que passou, junto: o fechamento das carreiras especiais e o que o mundo fez (`EnquantoIsso`). Ano
 * tranquilo, sem nada disso, não ganha caixa vazia — a biografia logo abaixo já marca "este ano".
 */
function AnoQuePassou({ vida, desde, abrirPessoa }: { vida: Vida; desde: number; abrirPessoa: (id: string) => void }) {
  const temFechamento = fechamentoDoAno(vida).length > 0;
  const temNoticias = noticiasDoAno(vida, desde).length > 0;
  // REWORK 9.5: a rotina que o ano teve (a fotografia do ano) — só quando há o que dizer.
  const rotina = rotinaDoAno(vida);
  if (!temFechamento && !temNoticias && !rotina) return null;
  return (
    <div className="ano-que-passou" id="ano-que-passou">
      {temFechamento && <FechamentoDoAno vida={vida} />}
      {rotina && (
        <section className="fechamento fechamento--rotina" aria-label="A rotina do ano">
          <div className="temporada"><p className="temporada__titulo">{rotina.titulo}</p>{rotina.linhas.map((l, k) => <p key={k} className={k === 0 ? 'temporada__linha' : 'nota'}>{l}</p>)}</div>
        </section>
      )}
      {temNoticias && <EnquantoIsso vida={vida} desde={desde} abrirPessoa={abrirPessoa} />}
    </div>
  );
}

/** O fechamento do ano das carreiras especiais (temporada, obra, mandato, negócio): só quando há o que contar. */
export function FechamentoDoAno({ vida }: { vida: Vida }) {
  const f = fechamentoDoAno(vida);
  if (!f.length) return null;
  return (
    <section className="fechamento" aria-label="O ano que passou">
      {f.map(x => (
        <div key={x.titulo} className="temporada">
          <p className="temporada__titulo">{x.titulo}</p>
          {x.linhas.map((l, k) => <p key={k} className={k === 0 ? 'temporada__linha' : 'nota'}>{l}</p>)}
        </div>
      ))}
    </section>
  );
}

/**
 * O painel "Agora": o que pede atenção — sem repetir as áreas. Quem mora
 * com você, quem precisa de você, as portas abertas (levando para a área
 * certa), o que está em andamento; o dinheiro só quando aperta.
 */
function Agora({ vida, area, irPara, abrirPessoa }: { vida: Vida; area: Area; irPara: (a: Aba) => void; abrirPessoa: (id: string) => void }) {
  const casa = emCasa(vida);
  const pessoal = sinalPessoal(vida);
  // Só o urgente atravessa as áreas; a vida social normal mora em Pessoas (FIX pós-REWORK 2).
  const sinais = area === 'pessoas' ? [] : sinaisSociais(vida, 12).filter(x => x.escopo === 'global').slice(0, 2);
  const i = idade(vida);
  const seg = seguranca(vida);
  const aperta = i >= 18 && (seg.nivel === 'no_vermelho' || seg.nivel === 'apertado');
  const processos = vida.processos.filter(p => p.tipo !== 'gestacao');
  const andamento: string[] = processos.map(p => (p.tipo === 'cnh' ? `Tirando ${habilitacaoDaVida(vida).a}` : p.tipo === 'adocao' ? 'Processo de adoção' : p.tipo === 'tratamento' ? `Na fila de tratamento ${redeDeSaude(vida).do}` : 'Mudança marcada'));
  if (vida.trabalho.candidaturas.length) andamento.push('Esperando o resultado do concurso');
  if (vida.trabalho.atual?.formacaoAte) andamento.push(`Curso de formação até ${anoDe(vida.trabalho.atual.formacaoAte)}`);
  if (vida.caminhos.esporte?.fase === 'base') andamento.push(`Na base ${doClube(vida.caminhos.esporte.clube)}`);
  if (vida.caminhos.politica?.campanha) andamento.push(`Em campanha até ${MESES[mesDe(vida.caminhos.politica.campanha.tEleicao)]} de ${anoDe(vida.caminhos.politica.campanha.tEleicao)}`);
  const portas = oportunidadesAbertas(vida);
  return (
    <div className="painel-agora">
      {pessoal && area !== 'voce' && (
        <button type="button" className="agora-voce" onClick={() => irPara('voce')}>
          <Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? "eu"} tamanho={34} rotulo="Você" expressao={expressaoDe(vida)} />
          <span>{pessoal}</span>
        </button>
      )}
      <h2 className="painel-agora__titulo">Em casa</h2>
      {casa.pessoas.length ? (
        <ul className="agora-pessoas">
          {casa.pessoas.map(p => (
            <li key={p.id}>
              <button type="button" className="agora-pessoa" onClick={() => abrirPessoa(p.id)}>
                <Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.pet?.semente ?? p.id} tamanho={34} rotulo={p.nome} especie={p.especie} porte={p.pet?.porte} />
                <span className="agora-pessoa__nome">{p.nome}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="agora-nota">{casa.texto}</p>}
      {sinais.length > 0 && (
        <>
          <h2 className="painel-agora__titulo painel-agora__titulo--pessoas">Pede atenção</h2>
          <ul className="agora-sinais">
            {sinais.map((x, k) => (
              <li key={k}>
                {x.pessoaId && vida.pessoas[x.pessoaId] ? <button type="button" className="agora-sinal" onClick={() => abrirPessoa(x.pessoaId!)}>{x.texto}</button> : <span className="agora-sinal">{x.texto}</span>}
              </li>
            ))}
          </ul>
        </>
      )}
      {portas.length > 0 && (
        <>
          <h2 className="painel-agora__titulo painel-agora__titulo--rumo">Portas abertas</h2>
          <ul className="agora-sinais">
            {portas.map(o => { const area = areaDaPorta(o); return <li key={o.id}><button type="button" className="agora-sinal agora-sinal--porta" onClick={() => irPara(area === 'tempo' ? 'semana' : 'oportunidades')}>{o.titulo}<span className="agora-sinal__prazo"> · até {anoDe(o.tFim)}</span></button></li>; })}
          </ul>
        </>
      )}
      {aperta && (
        <button type="button" className="agora-dinheiro" onClick={() => irPara('dinheiro')}>
          <span className="agora-dinheiro__rotulo">O dinheiro</span>
          <strong>{leituraDaSeguranca(vida).palavra}</strong>
        </button>
      )}
      {andamento.length > 0 && (
        <>
          <h2 className="painel-agora__titulo">Em andamento</h2>
          <ul className="agora-processos">
            {andamento.map((p, k) => <li key={k}>{p}</li>)}
          </ul>
        </>
      )}
    </div>
  );
}

function Menu({ c, aoFechar, ir }: { c: ControleVida; aoFechar: () => void; ir: (l: Lugar) => void }) {
  return (
    // REWORK 6.5: a folha comum (prende o foco, fecha com Esc, devolve o foco a quem abriu) — antes, uma cópia sem teclado.
    <Folha titulo="VIDA" rotulo="Menu" aoFechar={aoFechar}>
        <div className="menu">
          <SeletorTema />
          <p className="nota">Sua vida é salva a cada passo, neste navegador. Para continuar em outro aparelho, exporte a vida num arquivo e importe lá.</p>
          <button type="button" className="botao botao--secundario" onClick={() => c.exportar()}>Exportar esta vida (arquivo)</button>
          <BaixarApp compacto />
          <ImportarVida c={c} aoTerminar={aoFechar} />
          <button type="button" className="botao botao--secundario" onClick={() => { c.setSom(!c.som); }}>{c.som ? 'Desligar o som' : 'Ligar o som'}</button>
          <button type="button" className="botao botao--secundario" onClick={() => { aoFechar(); c.setTela('inicio'); }}>Voltar ao início</button>
          <button type="button" className="botao botao--perigo" onClick={() => { if (window.confirm('Apagar esta vida e começar outra? Não dá para desfazer.')) { aoFechar(); c.recomecar(); } }}>Abandonar esta vida</button>
          <OndeFica ir={ir} />
        </div>
    </Folha>
  );
}

/** "Eu quero fazer X. Onde eu começo?" — o mapa de intenções (`navegacao`), com o caminho de cada uma. */
function OndeFica({ ir }: { ir: (l: Lugar) => void }) {
  // REWORK 7: com quarenta intenções, procurar é mais rápido que rolar ("violão", "salário", "mãe").
  const [busca, setBusca] = useState('');
  const sem = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const termo = sem(busca.trim());
  const lista = MAPA_DE_INTENCOES.filter(x => !termo || sem(`${x.quero} ${x.la} ${rotuloDoLugar(x.lugar)}`).includes(termo));
  return (
    <section className="onde-fica" aria-labelledby="onde-fica-titulo">
      <h2 id="onde-fica-titulo" className="subtitulo">Onde fica cada coisa</h2>
      <label className="catalogo__busca onde-fica__busca"><span className="sr-only">Procurar o que você quer fazer</span>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
        <input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="O que você quer fazer? (violão, salário, mãe…)" autoComplete="off" />
      </label>
      {lista.length === 0 && <p className="nota">Nada com essa palavra. Tente outra — ou percorra as áreas no alto.</p>}
      <ul className="onde-fica__lista">
        {lista.map(x => (
          <li key={x.id}>
            <button type="button" className="onde-fica__item" onClick={() => ir(x.lugar)}>
              <span className="onde-fica__quero">{x.quero}</span>
              <span className="onde-fica__onde">{rotuloDoLugar(x.lugar)} <span aria-hidden>→</span></span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Importar uma vida de um arquivo: lê, valida, mostra de quem é — e só
 * substitui a vida atual depois de confirmar.
 */
import { ImportarVida } from './ImportarVida';
import { Tempo } from '../jogo/Tempo';
import { oportunidadesAbertas } from '../../motor/sistemas/mercados';
export { ImportarVida };
