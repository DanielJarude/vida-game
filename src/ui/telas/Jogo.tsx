/**
 * O jogo em andamento.
 *
 * Oito áreas, cada uma respondendo a uma pergunta:
 *   Vida      o que aconteceu (a biografia — o centro)
 *   Você      como eu estou (corpo, cabeça, humor, dinheiro)
 *   Pessoas   quem está na minha vida
 *   Trabalho  a minha vida profissional: agora, em paralelo, outras possibilidades (a partir dos 14)
 *   Estudos   a minha formação: onde estudo, o que já fiz, o que posso estudar
 *   Casa      onde moro, o que é meu, a vida dentro de casa
 *   Tempo     para onde vai a minha semana
 *   Cidade    onde vivo e o que a cidade oferece (a partir dos 16)
 * Cada área tem um tom próprio (tokens) e uma composição própria. O painel
 * "Agora" (desktop) diz o que pede atenção, sem repetir as áreas.
 */

import { useEffect, useId, useRef, useState } from 'react';
import type { ControleVida } from '../useVida';
import type { Vida } from '../../motor/tipos';
import { idade, idadePessoa } from '../../motor/nucleo';
import { anoDe } from '../../motor/tempo';
import { municipio } from '../../motor/dados/lugares';
import { seguranca } from '../../motor/sistemas/dinheiro';
import { leituraDaSeguranca } from '../leituraMaterial';
import { Retrato } from '../avatar/Retrato';
import { LinhaDaVida } from '../jogo/LinhaDaVida';
import { Momento, Resultado } from '../jogo/Momento';
import { Pessoas } from '../jogo/Pessoas';
import { Estudos, areaDaPorta } from '../jogo/Estudos';
import { Cidade } from '../jogo/Cidade';
import { Casa } from '../jogo/Casa';
import { Tempo } from '../jogo/Tempo';
import { Voce } from '../jogo/Voce';
import { Trabalho } from '../jogo/Trabalho';
import { expressaoDe, momentoAtual, sinalPessoal } from '../estadoPessoal';
import { Fim } from './Fim';
import { faseDaVida } from '../apresentar';
import { emCasa, sinaisSociais } from '../leitura';
import { doClube } from '../../motor/dados/clubes';

export type Aba = 'vida' | 'voce' | 'pessoas' | 'trabalho' | 'estudos' | 'casa' | 'tempo' | 'cidade';

const ABAS: { id: Aba; rotulo: string; curto: string; icone: string }[] = [
  { id: 'vida', rotulo: 'Linha da Vida', curto: 'Vida', icone: 'M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4V4zm0 12a4 4 0 0 0 4 4' },
  { id: 'voce', rotulo: 'Você', curto: 'Você', icone: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm-7.5 9a7.5 7.5 0 0 1 15 0' },
  { id: 'pessoas', rotulo: 'Pessoas', curto: 'Pessoas', icone: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 10a7 7 0 0 1 14 0M17 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3' },
  { id: 'trabalho', rotulo: 'Trabalho', curto: 'Trabalho', icone: 'M3.5 8h17v11.5h-17zM9 8V5.5h6V8M3.5 13.5h17' },
  { id: 'estudos', rotulo: 'Estudos', curto: 'Estudos', icone: 'M12 3l10 5-10 5L2 8l10-5zm-6 7.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5' },
  { id: 'casa', rotulo: 'Casa', curto: 'Casa', icone: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9z' },
  { id: 'tempo', rotulo: 'Tempo livre', curto: 'Tempo', icone: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-13v5l3 2' },
  { id: 'cidade', rotulo: 'Cidade', curto: 'Cidade', icone: 'M3 21V10l5-3v14M8 21V4l8 3v14M16 21v-9l5 2v7M2 21h20M11 9h2M11 12h2M11 15h2' }
];

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
const temCidade = (v: Vida) => idade(v) >= 16;

export function Jogo({ c }: { c: ControleVida }) {
  const vida = c.vida!;
  const [aba, setAbaBruta] = useState<Aba>('vida');
  const [menu, setMenu] = useState(false);
  const [pessoaAberta, setPessoaAberta] = useState<string | null>(null);
  const conteudo = useRef<HTMLElement>(null);
  const abas = ABAS.filter(a => (a.id !== 'trabalho' || temTrabalho(vida)) && (a.id !== 'cidade' || temCidade(vida)));
  const setAba = (a: Aba) => setAbaBruta(a === 'trabalho' && !temTrabalho(vida) ? 'estudos' : a === 'cidade' && !temCidade(vida) ? 'casa' : a);
  const abrirPessoa = (id: string | null) => { setPessoaAberta(id); if (id) setAba('pessoas'); };

  useEffect(() => { conteudo.current?.scrollTo?.({ top: 0 }); window.scrollTo?.({ top: 0 }); }, [aba]);
  useEffect(() => { if (c.marcaAno > 0) { setAbaBruta('vida'); window.scrollTo?.({ top: 0 }); } }, [c.marcaAno]);

  if (vida.morte) return <Fim vida={vida} c={c} />;
  const i = idade(vida);
  const m = municipio(vida.moradia.municipioId);

  return (
    <div className="jogo" data-clima={climaDe(vida)}>
      <header className="cabecalho">
        <button type="button" className="marca" onClick={() => setMenu(true)} aria-label="Menu">VIDA</button>
        <nav className="abas" aria-label="Seções">
          {abas.map(a => (
            <button key={a.id} type="button" className={`aba aba--${a.id}${aba === a.id ? ' aba--ativa' : ''}`} aria-label={a.rotulo} aria-current={aba === a.id ? 'page' : undefined} onClick={() => setAba(a.id)}>
              <Icone d={a.icone} /><span>{a.rotulo}</span>
            </button>
          ))}
        </nav>
        <button type="button" className="cabecalho__eu" onClick={() => setAba('voce')} aria-label={`${vida.eu.nome}, ${i} anos: ver como você está`}>
          <Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={i} semente="eu" tamanho={36} rotulo={vida.eu.nome} expressao={expressaoDe(vida)} />
          <span className="cabecalho__eu-texto">
            <strong>{vida.eu.nome}, {i} {i === 1 ? 'ano' : 'anos'}</strong>
            <span>{anoDe(vida.t)} · {m.nome}, {m.uf}</span>
          </span>
        </button>
      </header>

      <div className={`palco palco--${aba}`}>
        <main className={`conteudo pagina pagina--${aba}`} ref={conteudo}>
          {aba === 'vida' && <><Hoje vida={vida} irPara={setAba} /><LinhaDaVida vida={vida} marca={c.marcaAno} /></>}
          {aba === 'voce' && <Voce vida={vida} agir={c.agir} irPara={setAba} abrirPessoa={abrirPessoa} />}
          {aba === 'pessoas' && <Pessoas vida={vida} agir={c.agir} aberta={pessoaAberta} abrir={setPessoaAberta} />}
          {aba === 'trabalho' && <Trabalho vida={vida} agir={c.agir} irPara={setAba} />}
          {aba === 'estudos' && <Estudos vida={vida} agir={c.agir} irPara={setAba} />}
          {aba === 'casa' && <Casa vida={vida} agir={c.agir} />}
          {aba === 'tempo' && <Tempo vida={vida} agir={c.agir} irPara={setAba} />}
          {aba === 'cidade' && <Cidade vida={vida} agir={c.agir} />}
        </main>

        <aside className="agora" aria-label="Agora">
          <Agora vida={vida} aba={aba} irPara={setAba} abrirPessoa={abrirPessoa} />
        </aside>
      </div>

      <div className="avancar">
        <button type="button" className="avancar__botao" onClick={c.avancar} disabled={!!vida.momento}>
          <span className="avancar__rotulo">Viver mais um ano</span>
          <span className="avancar__idade">{i} → {i + 1}</span>
        </button>
      </div>

      <nav className={`barra barra--${abas.length}`} aria-label="Seções">
        {abas.map(a => (
          <button key={a.id} type="button" className={`barra__item barra__item--${a.id}${aba === a.id ? ' barra__item--ativo' : ''}`} aria-current={aba === a.id ? 'page' : undefined} onClick={() => setAba(a.id)}>
            <Icone d={a.icone} /><span>{a.curto}</span>
          </button>
        ))}
      </nav>

      {vida.momento && <Momento vida={vida} agir={c.agir} />}
      {!vida.momento && c.resultado && <Resultado titulo={c.resultado.titulo} texto={c.resultado.texto} aoFechar={c.fecharResultado} vida={vida} pessoaId={c.resultado.pessoaId} mudancas={c.resultado.mudancas} />}
      {menu && <Menu c={c} aoFechar={() => setMenu(false)} />}
    </div>
  );
}

/**
 * O alto da Linha da Vida: o rosto, o nome, a idade, uma frase sobre agora —
 * e nada mais. O resto é biografia.
 */
function Hoje({ vida, irPara }: { vida: Vida; irPara: (a: Aba) => void }) {
  const i = idade(vida);
  return (
    <header className="hoje">
      <button type="button" className="hoje__rosto" onClick={() => irPara('voce')} aria-label="Ver como você está">
        <Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={i} semente="eu" tamanho={72} rotulo={`${vida.eu.nome} aos ${i}`} expressao={expressaoDe(vida)} />
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
function Agora({ vida, aba, irPara, abrirPessoa }: { vida: Vida; aba: Aba; irPara: (a: Aba) => void; abrirPessoa: (id: string) => void }) {
  const casa = emCasa(vida);
  const pessoal = sinalPessoal(vida);
  const sinais = aba === 'pessoas' ? [] : sinaisSociais(vida);
  const i = idade(vida);
  const seg = seguranca(vida);
  const aperta = i >= 18 && (seg.nivel === 'no_vermelho' || seg.nivel === 'apertado');
  const processos = vida.processos.filter(p => p.tipo !== 'gestacao');
  const andamento: string[] = processos.map(p => (p.tipo === 'cnh' ? 'Autoescola' : p.tipo === 'adocao' ? 'Processo de adoção' : p.tipo === 'tratamento' ? 'Na fila de tratamento do SUS' : 'Mudança marcada'));
  if (vida.trabalho.candidaturas.length) andamento.push('Esperando o resultado do concurso');
  if (vida.trabalho.atual?.formacaoAte) andamento.push(`Curso de formação até ${anoDe(vida.trabalho.atual.formacaoAte)}`);
  if (vida.caminhos.esporte?.fase === 'base') andamento.push(`Na base ${doClube(vida.caminhos.esporte.clube)}`);
  if (vida.caminhos.politica?.campanha) andamento.push(`Em campanha até outubro de ${anoDe(vida.caminhos.politica.campanha.tEleicao)}`);
  const portas = vida.caminhos.oportunidades.filter(o => o.tFim > vida.t);
  return (
    <div className="painel-agora">
      {pessoal && aba !== 'voce' && (
        <button type="button" className="agora-voce" onClick={() => irPara('voce')}>
          <Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={i} semente="eu" tamanho={34} rotulo="Você" expressao={expressaoDe(vida)} />
          <span>{pessoal}</span>
        </button>
      )}
      <h2 className="painel-agora__titulo">Em casa</h2>
      {casa.pessoas.length ? (
        <ul className="agora-pessoas">
          {casa.pessoas.map(p => (
            <li key={p.id}>
              <button type="button" className="agora-pessoa" onClick={() => abrirPessoa(p.id)}>
                <Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.id} tamanho={34} rotulo={p.nome} especie={p.especie} />
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
            {portas.map(o => { const area = areaDaPorta(o); return <li key={o.id}><button type="button" className="agora-sinal agora-sinal--porta" onClick={() => irPara(area === 'trabalho' && temTrabalho(vida) ? 'trabalho' : area === 'tempo' ? 'tempo' : 'estudos')}>{o.titulo}<span className="agora-sinal__prazo"> · até {anoDe(o.tFim)}</span></button></li>; })}
          </ul>
        </>
      )}
      {aperta && (
        <button type="button" className="agora-dinheiro" onClick={() => irPara('voce')}>
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

function Menu({ c, aoFechar }: { c: ControleVida; aoFechar: () => void }) {
  return (
    <div className="veu" onClick={e => { if (e.target === e.currentTarget) aoFechar(); }}>
      <div className="folha folha--media" role="dialog" aria-modal="true" aria-label="Menu">
        <div className="folha__topo"><div className="folha__titulo">VIDA</div><button type="button" className="folha__fechar" onClick={aoFechar} aria-label="Fechar">×</button></div>
        <div className="folha__corpo menu">
          <p className="nota">Sua vida é salva a cada passo, neste navegador. Para continuar em outro aparelho, exporte a vida num arquivo e importe lá.</p>
          <button type="button" className="botao botao--secundario" onClick={() => c.exportar()}>Exportar esta vida (arquivo)</button>
          <ImportarVida c={c} aoTerminar={aoFechar} />
          <button type="button" className="botao botao--secundario" onClick={() => { c.setSom(!c.som); }}>{c.som ? 'Desligar o som' : 'Ligar o som'}</button>
          <button type="button" className="botao botao--secundario" onClick={() => { aoFechar(); c.setTela('inicio'); }}>Voltar ao início</button>
          <button type="button" className="botao botao--perigo" onClick={() => { if (window.confirm('Apagar esta vida e começar outra? Não dá para desfazer.')) { aoFechar(); c.recomecar(); } }}>Abandonar esta vida</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Importar uma vida de um arquivo: lê, valida, mostra de quem é — e só
 * substitui a vida atual depois de confirmar.
 */
export function ImportarVida({ c, aoTerminar }: { c: ControleVida; aoTerminar?: () => void }) {
  const [erro, setErro] = useState<string | null>(null);
  const [previa, setPrevia] = useState<{ texto: string; resumo: string } | null>(null);
  const idArquivo = useId();
  const ler = (arquivo: File | undefined) => {
    setErro(null); setPrevia(null);
    if (!arquivo) return;
    if (arquivo.size > 12 * 1024 * 1024) { setErro('O arquivo é grande demais para ser uma vida do VIDA.'); return; }
    arquivo.text().then(texto => {
      const r = c.previaImportacao(texto);
      if (r.tipo === 'erro') setErro(r.motivo); else setPrevia({ texto, resumo: r.resumo });
    }).catch(() => setErro('Não foi possível ler esse arquivo.'));
  };
  return (
    <div className="importar">
      <label className="botao botao--secundario importar__botao" htmlFor={idArquivo}>Importar uma vida (arquivo)</label>
      <input id={idArquivo} className="sr-only" type="file" accept=".json,application/json" onChange={e => ler(e.target.files?.[0])} />
      {erro && <p className="nota nota--ruim" role="alert"><span aria-hidden>! </span>{erro}</p>}
      {previa && (
        <div className="importar__previa" role="group" aria-label="Confirmar importação">
          <p>{previa.resumo}</p>
          {c.salva && <p className="nota nota--atencao"><span aria-hidden>! </span>Isso substitui a vida salva agora ({c.salva.nome}, {c.salva.idade} anos). Exporte antes, se quiser guardá-la.</p>}
          <div className="grupo-acoes grupo-acoes--linha">
            <button type="button" className="botao botao--principal" onClick={() => { if (c.importar(previa.texto)) { setPrevia(null); aoTerminar?.(); } }}>Importar e continuar essa vida</button>
            <button type="button" className="botao botao--discreto" onClick={() => setPrevia(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
