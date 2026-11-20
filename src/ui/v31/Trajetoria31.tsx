/**
 * VIDA 31 · MINHA TRAJETÓRIA — a página inicial de Caminhos (pacote à parte, carregado ao abrir Caminhos).
 */
import { useState as useState31 } from 'react';
import type { Vida } from '../../motor/tipos';
import { idade } from '../../motor/nucleo';
import { anoDe } from '../../motor/tempo';
import { ocupacaoOuNula } from '../../motor/dados/ocupacoes';
import { nomeOcupacao, proximoPasso } from '../../motor/sistemas/trabalho';
import { oportunidadesAbertas } from '../../motor/sistemas/mercados';
import { rotuloSerie } from '../../motor/sistemas/escola';
import { palavraDesempenho } from '../apresentar';
import { DIVISOES_CAMINHOS, type Aba, type DivisaoCaminhos, type ParteCaminhos } from '../navegacao';
import { areaDaPorta } from '../jogo/Estudos';
import { cap, divisaoDaOcupacao, estadoDaDivisao, faseDosCaminhos, ordemDasDivisoes, proximoNosCaminhos, situacaoAtual } from '../jogo/CaminhosDaVida';

/**
 * VIDA 31 · MINHA TRAJETÓRIA — a página inicial de Caminhos. Uma tela só responde: onde estou (o que ocupa a vida, cada
 * coisa leva à sua divisão), quanto falta para o próximo degrau (os requisitos que o motor cobra — nada estimado), o que
 * fazer a seguir, as portas abertas (com prazo) e, embaixo, EXPLORAR: os outros caminhos numa lista com busca, em vez de
 * sete abas no alto. As divisões continuam todas lá dentro, iguais.
 */
const ICONE_LADO: Record<string, string> = {
  formacao: 'M3 9l9-5 9 5-9 5-9-5zm4 2.5V16c0 1.5 2.5 3 5 3s5-1.5 5-3v-4.5',
  trabalho: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
  publica: 'M4 20h16M6 17V10M10 17V10M14 17V10M18 17V10M3 10l9-6 9 6z',
  outros: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
  guia: 'M4 5l5-2 6 2 5-2v16l-5 2-6-2-5 2zM9 3v16M15 5v16',
  submundo: 'M12 3a7 7 0 0 0-7 7v4l-2 3h18l-2-3v-4a7 7 0 0 0-7-7zM9 21h6',
  estudos: 'M3 9l9-5 9 5-9 5-9-5zm4 2.5V16c0 1.5 2.5 3 5 3s5-1.5 5-3v-4.5'
};
function Ic31({ d }: { d: string }) {
  return <svg className="traj31__icone" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

export default function Trajetoria31({ vida, irDivisao, irPara, abrirConvite }: { vida: Vida; irDivisao: (d: DivisaoCaminhos, p?: ParteCaminhos) => void; irPara: (a: Aba) => void; abrirConvite?: (id: string) => void }) {
  const i = idade(vida);
  const agora = situacaoAtual(vida);
  const prox = proximoNosCaminhos(vida);
  const degrau = proximoPasso(vida);
  const portas = oportunidadesAbertas(vida);
  const [busca, setBusca] = useState31('');
  const b = vida.educacao.basica;
  const feitos = degrau ? degrau.requisitos.filter(r => r.ok).length : 0;
  const total = degrau ? degrau.requisitos.length : 0;
  // O que dá para fazer a seguir: o próximo passo do motor primeiro; depois as portas de sempre, pela idade.
  const passos: { id: string; rotulo: string; nota?: string; ir: () => void }[] = [];
  if (prox) passos.push({ id: 'proximo', rotulo: prox.texto, nota: `em ${DIVISOES_CAMINHOS.find(y => y.id === prox.divisao)!.rotulo}`, ir: () => irDivisao(prox.divisao, prox.parte) });
  if (i >= 14) passos.push({ id: 'vagas', rotulo: vida.trabalho.atual ? 'Ver outras vagas' : 'Procurar trabalho', nota: 'vagas, candidaturas, entrevistas', ir: () => irPara('vagas') });
  if (i >= 14) passos.push({ id: 'cursos', rotulo: 'Cursos e faculdade', nota: 'técnico, graduação, pós, bolsas', ir: () => irPara('cursos') });
  if (i >= 16) passos.push({ id: 'concursos', rotulo: 'Concursos e política', nota: 'editais, cargos, eleições', ir: () => irPara('concursos') });
  if (i >= 16) passos.push({ id: 'negocio', rotulo: 'Por conta ou um negócio', nota: 'abrir, sociedade, trabalho em paralelo', ir: () => irPara('negocio') });
  if (vida.trabalho.historico.length || vida.trabalho.atual) passos.push({ id: 'carreira', rotulo: 'Minha carreira', nota: 'currículo, experiência, reconhecimento', ir: () => irPara('minha_carreira') });
  const divisoes = [...ordemDasDivisoes(vida), 'guia' as const];
  const termo = busca.trim().toLowerCase();
  const achadas = divisoes.filter(d => { if (!termo) return true; const x = DIVISOES_CAMINHOS.find(y => y.id === d)!; return `${x.rotulo} ${x.oque} ${estadoDaDivisao(vida, d)}`.toLowerCase().includes(termo); });
  return (
    <div className="traj31">
      <header className="folio folio--caminhos traj31__cabeca">
        <p className="folio__kicker"><span className="folio__area">Caminhos</span> · minha trajetória</p>
        <h1 className="folio__titulo">{faseDosCaminhos(vida)}</h1>
      </header>

      <section className="traj31__bloco traj31__agora" aria-labelledby="traj31-agora">
        <h2 id="traj31-agora" className="traj31__titulo">Agora</h2>
        <ul className="situacao-atual traj31__ocupacoes" aria-label="O que ocupa a sua vida agora">
          {agora.map(x => {
            const d = divisaoDaOcupacao(x, vida);
            return (
              <li key={x.id} className={`situacao-atual__item situacao-atual__item--${x.lado} traj31__ocupacao`} data-ocupacao={x.id}>
                <button type="button" className="situacao-atual__ir" onClick={() => irDivisao(d, 'agora')} disabled={x.id === 'nada'}>
                  <Ic31 d={ICONE_LADO[d] ?? ICONE_LADO.trabalho} />
                  <span className="situacao-atual__lado">{DIVISOES_CAMINHOS.find(y => y.id === d)!.rotulo}</span>
                  <span className="situacao-atual__rotulo">{cap(x.rotulo)}</span>
                  {x.detalhe && <span className="situacao-atual__detalhe">{x.detalhe}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        {degrau && (
          <div className="traj31__degrau">
            <p className="traj31__degrau-topo"><span>Próximo degrau</span><strong>{cap(nomeOcupacao(vida, ocupacaoOuNula(degrau.ocupacaoId)!))}</strong><span className="traj31__degrau-conta">{feitos} de {total} requisitos{degrau.previsao ? ` · previsão ${degrau.previsao}` : ''}</span></p>
            <span className="traj31__trilho" aria-hidden><span className="traj31__barra" style={{ width: `${total ? Math.max(6, (feitos / total) * 100) : 6}%` }} /></span>
            <ul className="traj31__requisitos">{degrau.requisitos.map((r, k) => <li key={k} className={r.ok ? 'traj31__req traj31__req--ok' : 'traj31__req'}><span aria-hidden>{r.ok ? '✓' : '○'}</span> {r.texto}</li>)}</ul>
          </div>
        )}
        {!degrau && b && !vida.educacao.evadiu && (
          <div className="traj31__degrau">
            <p className="traj31__degrau-topo"><span>Na escola</span><strong>{rotuloSerie(b)}</strong><span className="traj31__degrau-conta">desempenho {palavraDesempenho(b.desempenho)}</span></p>
            <span className="traj31__trilho" aria-hidden><span className="traj31__barra" style={{ width: `${Math.max(6, Math.round(b.desempenho))}%` }} /></span>
          </div>
        )}
      </section>

      {passos.length > 0 && (
        <section className="traj31__bloco" aria-labelledby="traj31-passos">
          <h2 id="traj31-passos" className="traj31__titulo">Próximos passos</h2>
          <ul className="traj31__passos">
            {passos.map((x, k) => (
              <li key={x.id}>
                <button type="button" className={`traj31__passo${k === 0 && x.id === 'proximo' ? ' traj31__passo--destaque' : ''}`} data-passo={x.id} onClick={x.ir}>
                  <span className="traj31__passo-rotulo">{x.rotulo}</span>{x.nota && <span className="traj31__passo-nota">{x.nota}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {portas.length > 0 && (
        <section className="traj31__bloco" aria-labelledby="traj31-portas">
          <h2 id="traj31-portas" className="traj31__titulo">Portas abertas <span className="traj31__conta">{portas.length}</span></h2>
          <ul className="traj31__portas">
            {portas.map(o => (
              <li key={o.id}><button type="button" className="traj31__porta" data-porta={o.id} onClick={() => (abrirConvite ? abrirConvite(o.id) : irPara(areaDaPorta(o) === 'estudos' ? 'cursos' : areaDaPorta(o) === 'tempo' ? 'outros_caminhos' : 'vagas'))}><strong>{o.titulo}</strong><span>até {anoDe(o.tFim)}</span></button></li>
            ))}
          </ul>
        </section>
      )}

      <section className="traj31__bloco traj31__explorar" aria-labelledby="traj31-explorar">
        <h2 id="traj31-explorar" className="traj31__titulo">Explorar caminhos</h2>
        <label className="traj31__busca"><span className="sr-only">Procurar um caminho</span><input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Procurar: faculdade, concurso, futebol, banda, crime…" /></label>
        <ul className="entradas-caminhos traj31__lista" aria-label="Os caminhos">
          {achadas.map(d => {
            const x = DIVISOES_CAMINHOS.find(y => y.id === d)!;
            return (
              <li key={d} className={`entrada-caminho entrada-caminho--${d}`}>
                <button type="button" className="entrada-caminho__botao" onClick={() => irDivisao(d)}>
                  <Ic31 d={ICONE_LADO[d] ?? ICONE_LADO.outros} />
                  <span className="entrada-caminho__nome">{x.rotulo}</span>
                  <span className="entrada-caminho__estado">{estadoDaDivisao(vida, d)}</span>
                  <span className="entrada-caminho__oque">{x.oque}</span>
                </button>
              </li>
            );
          })}
          {!achadas.length && <li className="nota">Nenhum caminho com “{busca}”. A busca do Menu (Onde fica cada coisa) procura em todo o jogo.</li>}
        </ul>
      </section>
    </div>
  );
}

