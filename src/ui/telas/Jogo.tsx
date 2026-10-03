/**
 * O jogo em andamento.
 *
 * Seis áreas ESTÁVEIS (REWORK 3 — `ui/navegacao`), cada uma respondendo a
 * uma pergunta; o que muda com a idade é o conteúdo e o destaque, não o
 * lugar das coisas:
 *   Linha da Vida  o que aconteceu (a biografia — o centro)
 *   Você           como eu estou (corpo, cabeça, humor, aparência e estilo)
 *   Pessoas        quem está na minha vida
 *   Formação       onde estudo, com quem, o que faço lá, o que posso estudar
 *   Trabalho       o que faço para viver (antes dos 14: quem sustenta a casa)
 *   Vida           a vida concreta: Casa · Dinheiro · Compras · Tempo livre · Cidade
 * Dentro de Vida, seções internas — em vez de mais abas no topo. O painel
 * "Agora" (desktop) diz o que pede atenção, sem repetir as áreas.
 */

import { BaixarApp } from './BaixarApp';
import { habilitacaoDaVida } from '../../motor/sistemas/autoescola';
import { redeDeSaude } from '../../motor/sistemas/saude';
import { useEffect, useRef, useState } from 'react';
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
import { Estudos, areaDaPorta } from '../jogo/Estudos';
import { Voce } from '../jogo/Voce';
import { Trabalho, TrabalhoAindaNao } from '../jogo/Trabalho';
import { VidaConcreta } from '../jogo/VidaConcreta';
import { expressaoDe, momentoAtual, sinalPessoal } from '../estadoPessoal';
import { Fim } from './Fim';
import { faseDaVida } from '../apresentar';
import { fechamentoDoAno } from '../../motor/sistemas/fechamento';
import { emCasa, sinaisSociais } from '../leitura';
import { doClube } from '../../motor/dados/clubes';
import { AREAS, MAPA_DE_INTENCOES, resolverDestino, rotuloDoLugar, type Aba, type Area, type Lugar, type SecaoVida } from '../navegacao';

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

const temTrabalho = (v: Vida) => idade(v) >= 14 || v.trabalho.historico.length > 0;

export function Jogo({ c }: { c: ControleVida }) {
  const vida = c.vida!;
  const [lugar, setLugar] = useState<Lugar>({ area: 'linha' });
  const [secao, setSecao] = useState<SecaoVida>('casa');
  const [menu, setMenu] = useState(false);
  const [pessoaAberta, setPessoaAberta] = useState<string | null>(null);
  const conteudo = useRef<HTMLElement>(null);
  const area = lugar.area;
  const ir = (d: Aba) => { const l = resolverDestino(d); if (l.secao) setSecao(l.secao); setLugar(l); };
  const irLugar = (l: Lugar) => { if (l.secao) setSecao(l.secao); setLugar(l); };
  const focar = (id: string | null) => { setPessoaAberta(id); c.focarPessoa(id); };
  const abrirPessoa = (id: string | null) => { focar(id); if (id) ir('pessoas'); };

  useEffect(() => { conteudo.current?.scrollTo?.({ top: 0 }); window.scrollTo?.({ top: 0 }); }, [area, secao]);
  useEffect(() => { if (c.marcaAno > 0) { setLugar({ area: 'linha' }); window.scrollTo?.({ top: 0 }); } }, [c.marcaAno]);

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
            <button key={a.id} type="button" className={`aba aba--${a.id}${area === a.id ? ' aba--ativa' : ''}`} aria-label={a.rotulo} aria-current={area === a.id ? 'page' : undefined} onClick={() => ir(a.id)}>
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
          {area === 'linha' && <><Hoje vida={vida} irPara={ir} />{c.marcaAno > 0 && <FechamentoDoAno vida={vida} />}<LinhaDaVida vida={vida} marca={c.marcaAno} /></>}
          {area === 'voce' && <Voce vida={vida} agir={c.agir} irPara={ir} abrirPessoa={abrirPessoa} />}
          {area === 'pessoas' && <Pessoas vida={vida} agir={c.agir} aberta={pessoaAberta} abrir={focar} />}
          {area === 'formacao' && <Estudos vida={vida} agir={c.agir} irPara={ir} abrirPessoa={abrirPessoa} />}
          {area === 'trabalho' && (temTrabalho(vida) ? <Trabalho vida={vida} agir={c.agir} irPara={ir} /> : <TrabalhoAindaNao vida={vida} irPara={ir} />)}
          {area === 'tempo' && <Tempo vida={vida} agir={c.agir} irPara={ir} />}
          {area === 'vida' && <VidaConcreta vida={vida} agir={c.agir} secao={secao} irSecao={s => ir(s)} irPara={ir} abrirPessoa={abrirPessoa} />}
        </main>

        <aside className="agora" aria-label="Agora">
          <Agora vida={vida} area={area} irPara={ir} abrirPessoa={abrirPessoa} />
        </aside>
      </div>

      <div className="avancar">
        <button type="button" className="avancar__botao" onClick={c.avancar} disabled={!!vida.momento}>
          <span className="avancar__rotulo">Viver mais um ano</span>
          <span className="avancar__idade">{i} → {i + 1}</span>
        </button>
      </div>

      <nav className={`barra barra--${AREAS.length}`} aria-label="Áreas">
        {AREAS.map(a => (
          <button key={a.id} type="button" className={`barra__item barra__item--${a.id}${area === a.id ? ' barra__item--ativo' : ''}`} aria-current={area === a.id ? 'page' : undefined} onClick={() => ir(a.id)}>
            <Icone d={a.icone} /><span>{a.curto}</span>
          </button>
        ))}
      </nav>

      {vida.momento && <Momento vida={vida} agir={c.agir} />}
      {!vida.momento && c.resultado && <Resultado titulo={c.resultado.titulo} texto={c.resultado.texto} aoFechar={c.fecharResultado} vida={vida} pessoaId={c.resultado.pessoaId} mudancas={c.resultado.mudancas} />}
      {menu && <Menu c={c} aoFechar={() => setMenu(false)} ir={l => { irLugar(l); setMenu(false); }} />}
    </div>
  );
}

/**
 * O alto da Linha da Vida: o rosto, o nome, a idade, uma frase sobre agora —
 * e nada mais. O resto é biografia.
 */
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

function Hoje({ vida, irPara }: { vida: Vida; irPara: (a: Aba) => void }) {
  const i = idade(vida);
  return (
    <header className="hoje">
      <button type="button" className="hoje__rosto" onClick={() => irPara('voce')} aria-label="Ver como você está">
        <Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? "eu"} tamanho={72} rotulo={`${vida.eu.nome} aos ${i}`} expressao={expressaoDe(vida)} />
      </button>
      <div className="hoje__texto">
        <p className="folio__kicker"><span className="folio__area">Linha da Vida</span> · {i} {i === 1 ? 'ano' : 'anos'} · {faseDaVida(i)}</p>
        <h1 className="hoje__nome">{vida.eu.nome} <span>{vida.eu.sobrenome}</span></h1>
        <p className="hoje__frase">{momentoAtual(vida)}</p>
      </div>
    </header>
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
            {portas.map(o => { const area = areaDaPorta(o); return <li key={o.id}><button type="button" className="agora-sinal agora-sinal--porta" onClick={() => irPara(area === 'trabalho' && temTrabalho(vida) ? 'trabalho' : area === 'tempo' ? 'tempo' : 'formacao')}>{o.titulo}<span className="agora-sinal__prazo"> · até {anoDe(o.tFim)}</span></button></li>; })}
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
    <div className="veu" onClick={e => { if (e.target === e.currentTarget) aoFechar(); }}>
      <div className="folha folha--media" role="dialog" aria-modal="true" aria-label="Menu">
        <div className="folha__topo"><div className="folha__titulo">VIDA</div><button type="button" className="folha__fechar" onClick={aoFechar} aria-label="Fechar">×</button></div>
        <div className="folha__corpo menu">
          <p className="nota">Sua vida é salva a cada passo, neste navegador. Para continuar em outro aparelho, exporte a vida num arquivo e importe lá.</p>
          <button type="button" className="botao botao--secundario" onClick={() => c.exportar()}>Exportar esta vida (arquivo)</button>
          <BaixarApp compacto />
          <ImportarVida c={c} aoTerminar={aoFechar} />
          <button type="button" className="botao botao--secundario" onClick={() => { c.setSom(!c.som); }}>{c.som ? 'Desligar o som' : 'Ligar o som'}</button>
          <button type="button" className="botao botao--secundario" onClick={() => { aoFechar(); c.setTela('inicio'); }}>Voltar ao início</button>
          <button type="button" className="botao botao--perigo" onClick={() => { if (window.confirm('Apagar esta vida e começar outra? Não dá para desfazer.')) { aoFechar(); c.recomecar(); } }}>Abandonar esta vida</button>
          <OndeFica ir={ir} />
        </div>
      </div>
    </div>
  );
}

/** "Eu quero fazer X. Onde eu começo?" — o mapa de intenções (`navegacao`), com o caminho de cada uma. */
function OndeFica({ ir }: { ir: (l: Lugar) => void }) {
  return (
    <section className="onde-fica" aria-labelledby="onde-fica-titulo">
      <h2 id="onde-fica-titulo" className="subtitulo">Onde fica cada coisa</h2>
      <ul className="onde-fica__lista">
        {MAPA_DE_INTENCOES.map(x => (
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
