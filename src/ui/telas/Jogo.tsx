/** O jogo em andamento. */

import { useEffect, useRef, useState } from 'react';
import type { ControleVida } from '../useVida';
import type { Vida } from '../../motor/tipos';
import { idade, idadePessoa } from '../../motor/nucleo';
import { anoDe } from '../../motor/tempo';
import { municipio } from '../../motor/dados/lugares';
import { saldoMensal } from '../../motor/sistemas/dinheiro';
import { tracosMarcantes } from '../../motor/personalidade';
import { Retrato } from '../avatar/Retrato';
import { LinhaDaVida } from '../jogo/LinhaDaVida';
import { Momento, Resultado } from '../jogo/Momento';
import { Pessoas } from '../jogo/Pessoas';
import { Rumo } from '../jogo/Rumo';
import { Casa } from '../jogo/Casa';
import { Tempo } from '../jogo/Tempo';
import { Fim } from './Fim';
import { dinheiroCurto, faseDaVida, ocupacaoAtual, ondeMora, palavraEstresse, palavraHumor, palavraSaude } from '../apresentar';
import { emCasa, lutoVisivel, sinaisSociais, situacaoAfetiva } from '../leitura';

type Aba = 'vida' | 'pessoas' | 'rumo' | 'casa' | 'tempo';

const ABAS: { id: Aba; rotulo: string; curto: string; icone: string }[] = [
  { id: 'vida', rotulo: 'Linha da Vida', curto: 'Vida', icone: 'M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4V4zm0 12a4 4 0 0 0 4 4' },
  { id: 'pessoas', rotulo: 'Pessoas', curto: 'Pessoas', icone: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 10a7 7 0 0 1 14 0M17 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3' },
  { id: 'rumo', rotulo: 'Estudo e trabalho', curto: 'Rumo', icone: 'M12 3l10 5-10 5L2 8l10-5zm-6 7.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5' },
  { id: 'casa', rotulo: 'Casa e dinheiro', curto: 'Casa', icone: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9z' },
  { id: 'tempo', rotulo: 'Tempo livre', curto: 'Tempo', icone: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-13v5l3 2' }
];

function Icone({ d }: { d: string }) {
  return <svg className="icone" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

export function Jogo({ c }: { c: ControleVida }) {
  const vida = c.vida!;
  const [aba, setAba] = useState<Aba>('vida');
  const [menu, setMenu] = useState(false);
  const [pessoaAberta, setPessoaAberta] = useState<string | null>(null);
  const abrirPessoa = (id: string | null) => { setPessoaAberta(id); if (id) setAba('pessoas'); };
  const conteudo = useRef<HTMLElement>(null);

  useEffect(() => { conteudo.current?.scrollTo?.({ top: 0 }); window.scrollTo?.({ top: 0 }); }, [aba]);
  useEffect(() => { if (c.marcaAno > 0) { setAba('vida'); window.scrollTo?.({ top: 0 }); } }, [c.marcaAno]);

  if (vida.morte) return <Fim vida={vida} c={c} />;
  const i = idade(vida);
  const m = municipio(vida.moradia.municipioId);

  return (
    <div className="jogo">
      <header className="cabecalho">
        <button type="button" className="marca" onClick={() => setMenu(true)} aria-label="Menu">VIDA</button>
        <nav className="abas" aria-label="Seções">
          {ABAS.map(a => (
            <button key={a.id} type="button" className={`aba${aba === a.id ? ' aba--ativa' : ''}`} aria-label={a.rotulo} aria-current={aba === a.id ? 'page' : undefined} onClick={() => setAba(a.id)}>
              <Icone d={a.icone} /><span>{a.rotulo}</span>
            </button>
          ))}
        </nav>
        <div className="cabecalho__idade">
          <Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={i} semente="eu" tamanho={36} rotulo={vida.eu.nome} />
          <div>
            <strong>{vida.eu.nome}, {i} {i === 1 ? 'ano' : 'anos'}</strong>
            <span>{anoDe(vida.t)} · {m.nome}, {m.uf}</span>
          </div>
        </div>
      </header>

      <div className={`regioes regioes--${aba}`}>
        <aside className="trilho" aria-label="Quem você é">
          <Identidade vida={vida} />
          <div className="trilho__agora"><Agora vida={vida} irPara={setAba} abrirPessoa={abrirPessoa} /></div>
        </aside>

        <main className="conteudo" ref={conteudo}>
          <h1 className="conteudo__titulo">{ABAS.find(a => a.id === aba)!.rotulo}</h1>
          {aba === 'vida' && <LinhaDaVida vida={vida} marca={c.marcaAno} />}
          {aba === 'pessoas' && <Pessoas vida={vida} agir={c.agir} aberta={pessoaAberta} abrir={setPessoaAberta} />}
          {aba === 'rumo' && <Rumo vida={vida} agir={c.agir} />}
          {aba === 'casa' && <Casa vida={vida} agir={c.agir} />}
          {aba === 'tempo' && <Tempo vida={vida} agir={c.agir} />}
        </main>

        <aside className="agora" aria-label="Agora">
          <Agora vida={vida} irPara={setAba} abrirPessoa={abrirPessoa} />
        </aside>
      </div>

      <div className="avancar">
        <button type="button" className="avancar__botao" onClick={c.avancar} disabled={!!vida.momento}>
          <span className="avancar__rotulo">Viver mais um ano</span>
          <span className="avancar__idade">{i} → {i + 1}</span>
        </button>
      </div>

      <nav className="barra" aria-label="Seções">
        {ABAS.map(a => (
          <button key={a.id} type="button" className={`barra__item${aba === a.id ? ' barra__item--ativo' : ''}`} aria-current={aba === a.id ? 'page' : undefined} onClick={() => setAba(a.id)}>
            <Icone d={a.icone} /><span>{a.curto}</span>
          </button>
        ))}
      </nav>

      {vida.momento && <Momento vida={vida} agir={c.agir} />}
      {!vida.momento && c.resultado && <Resultado titulo={c.resultado.titulo} texto={c.resultado.texto} aoFechar={c.fecharResultado} />}
      {menu && <Menu c={c} aoFechar={() => setMenu(false)} />}
    </div>
  );
}

function Identidade({ vida }: { vida: Vida }) {
  const i = idade(vida);
  const tracos = tracosMarcantes(vida);
  return (
    <div className="identidade">
      <Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={i} semente="eu" tamanho={132} rotulo={`${vida.eu.nome} aos ${i}`} />
      <h2 className="identidade__nome">{vida.eu.nome} <span>{vida.eu.sobrenome}</span></h2>
      <p className="identidade__idade"><strong>{i}</strong> {i === 1 ? 'ano' : 'anos'} · {faseDaVida(i)}</p>
      <p className="identidade__linha">{ocupacaoAtual(vida)}</p>
      <p className="identidade__linha">{ondeMora(vida)}</p>
      {situacaoAfetiva(vida) && <p className="identidade__linha identidade__linha--afeto">{situacaoAfetiva(vida)}{lutoVisivel(vida) ? ` · ${lutoVisivel(vida)}` : ''}</p>}
      <dl className="estado">
        <div><dt>Saúde</dt><dd>{palavraSaude(vida.corpo.saude)}</dd></div>
        <div><dt>Humor</dt><dd>{palavraHumor(vida.mente.felicidade)}</dd></div>
        {i >= 10 && <div><dt>Cabeça</dt><dd>{palavraEstresse(vida.mente.estresse)}</dd></div>}
      </dl>
      {tracos.length > 0 && <p className="identidade__tracos">Quem convive diz que você é {tracos.join(', ').replace(/, ([^,]*)$/, ' e $1')}.</p>}
      {vida.corpo.condicoes.length > 0 && <p className="identidade__condicoes">{vida.corpo.condicoes.map(c => `${c.nome}${c.tratando ? ' (em tratamento)' : ''}`).join(' · ')}</p>}
    </div>
  );
}

/**
 * O painel lateral: o que está acontecendo agora. Não repete a lista de
 * Pessoas — diz quem mora com você e o que, na vida social, pede atenção.
 */
function Agora({ vida, irPara, abrirPessoa }: { vida: Vida; irPara: (a: Aba) => void; abrirPessoa: (id: string) => void }) {
  const casa = emCasa(vida);
  const sinais = sinaisSociais(vida);
  const s = saldoMensal(vida);
  const i = idade(vida);
  const processos = vida.processos.filter(p => p.tipo !== 'gestacao');
  return (
    <div className="painel-agora">
      <h2 className="painel-agora__titulo">Em casa</h2>
      {casa.pessoas.length ? (
        <ul className="agora-pessoas">
          {casa.pessoas.map(p => (
            <li key={p.id}>
              <button type="button" className="agora-pessoa" onClick={() => abrirPessoa(p.id)}>
                <Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.id} tamanho={34} rotulo={p.nome} />
                <span className="agora-pessoa__nome">{p.nome}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="agora-nota">{casa.texto}</p>}
      {sinais.length > 0 && (
        <>
          <h2 className="painel-agora__titulo">Pede atenção</h2>
          <ul className="agora-sinais">
            {sinais.map((x, k) => (
              <li key={k}>
                {x.pessoaId && vida.pessoas[x.pessoaId] ? <button type="button" className="agora-sinal" onClick={() => abrirPessoa(x.pessoaId!)}>{x.texto}</button> : <span className="agora-sinal">{x.texto}</span>}
              </li>
            ))}
          </ul>
        </>
      )}
      {(i >= 16 || s.renda > 0) && (
        <>
          <h2 className="painel-agora__titulo painel-agora__titulo--secundario">O mês</h2>
          <button type="button" className="agora-dinheiro" onClick={() => irPara('casa')}>
            <span>Entra {dinheiroCurto(s.renda)}</span>
            <span>Sai {dinheiroCurto(s.despesa)}</span>
            <strong className={s.renda - s.despesa >= 0 ? 'bom' : 'ruim'}>{s.renda - s.despesa >= 0 ? 'Sobra' : 'Falta'} {dinheiroCurto(Math.abs(s.renda - s.despesa))}</strong>
          </button>
        </>
      )}
      {processos.length > 0 && (
        <>
          <h2 className="painel-agora__titulo painel-agora__titulo--secundario">Em andamento</h2>
          <ul className="agora-processos">
            {processos.map(p => (
              <li key={p.id}>{p.tipo === 'cnh' ? 'Autoescola' : p.tipo === 'adocao' ? 'Processo de adoção' : p.tipo === 'tratamento' ? 'Na fila de tratamento do SUS' : 'Mudança marcada'}</li>
            ))}
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
          <p className="nota">Sua vida é salva a cada passo.</p>
          <button type="button" className="botao botao--secundario" onClick={() => { c.setSom(!c.som); }}>{c.som ? 'Desligar o som' : 'Ligar o som'}</button>
          <button type="button" className="botao botao--secundario" onClick={() => { aoFechar(); c.setTela('inicio'); }}>Voltar ao início</button>
          <button type="button" className="botao botao--perigo" onClick={() => { if (window.confirm('Apagar esta vida e começar outra? Não dá para desfazer.')) { aoFechar(); c.recomecar(); } }}>Abandonar esta vida</button>
        </div>
      </div>
    </div>
  );
}
