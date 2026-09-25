/** Nascer: o jogador escolhe o que uma pessoa não escolhe — e o resto é sorte. */

import { useMemo, useState } from 'react';
import type { ControleVida } from '../useVida';
import type { Classe, Genero, Visual } from '../../motor/tipos';
import { MUNICIPIOS, NOMES_UF, rotuloPerfil } from '../../motor/dados/lugares';
import { sortearNome, sortearSobrenome } from '../../motor/dados/nomes';
import { criarRng } from '../../motor/rng';
import { CABELOS_F, CABELOS_M, CABELOS_N, CORES_CABELO, CORES_OLHOS, PELES, visualAleatorio } from '../../motor/pessoas';
import { Retrato } from '../avatar/Retrato';
import { Escolha } from '../comum';

const ROTULO_CABELO: Record<string, string> = {
  raspado: 'Raspado', curto: 'Curto', curto_lado: 'Curto de lado', ondulado: 'Ondulado', crespo_curto: 'Crespo curto', cacheado: 'Cacheado',
  longo_liso: 'Longo liso', longo_ondulado: 'Longo ondulado', cacheado_longo: 'Cacheado longo', black: 'Black', chanel: 'Chanel',
  coque: 'Coque', trancas: 'Tranças', rabo: 'Rabo de cavalo'
};
const COR_PELE: Record<string, string> = { p1: '#f3d7c2', p2: '#e9c09d', p3: '#d49f75', p4: '#b27b52', p5: '#8b5b3a', p6: '#5f3c27' };
const COR_CABELO: Record<string, string> = { preto: '#1c1917', castanho_escuro: '#35251c', castanho: '#563a28', castanho_claro: '#86603f', loiro: '#caa25e', ruivo: '#a24a27' };
const COR_OLHO: Record<string, string> = { castanho_escuro: '#2f1d14', castanho: '#553620', mel: '#86662b', verde: '#56764a', azul: '#4b75a0' };

const aleatorio = () => criarRng(Math.floor(Math.random() * 2 ** 31));

export function Criacao({ c }: { c: ControleVida }) {
  const [genero, setGenero] = useState<Genero>('feminino');
  const [tratamento, setTratamento] = useState<Genero>('nao_binario');
  const [podeGestar, setPodeGestar] = useState(false);
  const [nome, setNome] = useState(() => sortearNome(aleatorio(), 'feminino', 2026));
  const [sobrenome, setSobrenome] = useState(() => sortearSobrenome(aleatorio()));
  const [uf, setUf] = useState('BA');
  const [cidade, setCidade] = useState('salvador-ba');
  const [classe, setClasse] = useState<Classe | 'sorte'>('sorte');
  const [visual, setVisual] = useState<Visual>(() => visualAleatorio(aleatorio(), 'feminino'));
  const [heranca, setHeranca] = useState(true);

  const ufs = useMemo(() => [...new Set(MUNICIPIOS.map(m => m.uf))].sort((a, b) => NOMES_UF[a].localeCompare(NOMES_UF[b])), []);
  const cidades = MUNICIPIOS.filter(m => m.uf === uf);
  const cidadeAtual = MUNICIPIOS.find(m => m.id === cidade);
  const cabelos = genero === 'masculino' ? CABELOS_M : genero === 'feminino' ? CABELOS_F : [...new Set([...CABELOS_N, ...CABELOS_M, ...CABELOS_F])];

  const trocarGenero = (g: Genero) => {
    setGenero(g);
    setNome(sortearNome(aleatorio(), g, 2026));
    const v = visualAleatorio(aleatorio(), g);
    setVisual(atual => ({ ...atual, cabelo: v.cabelo, barba: g === 'masculino' ? v.barba : undefined }));
  };
  const tudoAleatorio = () => {
    const r = aleatorio();
    const g: Genero = r.chance(0.5) ? 'feminino' : 'masculino';
    const m = r.pick(MUNICIPIOS);
    setGenero(g);
    setNome(sortearNome(r, g, 2026));
    setSobrenome(sortearSobrenome(r));
    setUf(m.uf);
    setCidade(m.id);
    setClasse('sorte');
    setVisual(visualAleatorio(r, g));
    setHeranca(true);
  };
  const nascer = () => c.nascer({
    nome: nome.trim() || 'Ana', sobrenome: sobrenome.trim() || 'Silva', genero, municipioId: cidade,
    classe: classe === 'sorte' ? undefined : classe,
    podeGestar: genero === 'nao_binario' ? podeGestar : undefined,
    tratamento: genero === 'nao_binario' ? tratamento : undefined,
    visual,
    herdarCores: heranca
  });

  return (
    <div className="criacao">
      <header className="criacao__cabeca">
        <button type="button" className="botao botao--discreto" onClick={() => c.setTela('inicio')}>← Voltar</button>
        <h1>Nascer</h1>
        <button type="button" className="botao botao--discreto" onClick={tudoAleatorio}>Tudo ao acaso</button>
      </header>

      <div className="criacao__corpo">
        <div className="criacao__retratos" aria-hidden>
          <Retrato visual={visual} genero={genero} idade={1} semente="eu" tamanho={96} />
          <Retrato visual={visual} genero={genero} idade={9} semente="eu" tamanho={96} />
          <Retrato visual={visual} genero={genero} idade={30} semente="eu" tamanho={96} />
          <Retrato visual={visual} genero={genero} idade={75} semente="eu" tamanho={96} />
        </div>

        <form className="criacao__form" onSubmit={e => { e.preventDefault(); nascer(); }}>
          <fieldset className="campo">
            <legend className="campo__rotulo">Gênero</legend>
            <Escolha rotulo="Gênero" valor={genero} aoMudar={trocarGenero} opcoes={[{ id: 'feminino', rotulo: 'Mulher' }, { id: 'masculino', rotulo: 'Homem' }, { id: 'nao_binario', rotulo: 'Não binária' }]} />
          </fieldset>
          {genero === 'nao_binario' && (
            <>
              <fieldset className="campo">
                <legend className="campo__rotulo">Como o texto fala de você</legend>
                <Escolha rotulo="Tratamento" valor={tratamento} aoMudar={setTratamento} opcoes={[{ id: 'nao_binario', rotulo: 'Neutro (elu)' }, { id: 'feminino', rotulo: 'Feminino (ela)' }, { id: 'masculino', rotulo: 'Masculino (ele)' }]} />
              </fieldset>
              <label className="campo campo--check">
                <input type="checkbox" checked={podeGestar} onChange={e => setPodeGestar(e.target.checked)} />
                <span>Tenho um corpo que pode engravidar</span>
              </label>
            </>
          )}
          <div className="campos-linha">
            <label className="campo">
              <span className="campo__rotulo">Nome</span>
              <input value={nome} onChange={e => setNome(e.target.value)} maxLength={30} autoComplete="off" />
            </label>
            <label className="campo">
              <span className="campo__rotulo">Sobrenome</span>
              <input value={sobrenome} onChange={e => setSobrenome(e.target.value)} maxLength={30} autoComplete="off" />
            </label>
          </div>
          <div className="campos-linha">
            <label className="campo">
              <span className="campo__rotulo">Estado</span>
              <select value={uf} onChange={e => { setUf(e.target.value); setCidade(MUNICIPIOS.find(m => m.uf === e.target.value)!.id); }}>
                {ufs.map(u => <option key={u} value={u}>{NOMES_UF[u]}</option>)}
              </select>
            </label>
            <label className="campo">
              <span className="campo__rotulo">Cidade</span>
              <select value={cidade} onChange={e => setCidade(e.target.value)}>
                {cidades.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </label>
          </div>
          {cidadeAtual && <p className="nota">{cidadeAtual.nome}: {rotuloPerfil(cidadeAtual.perfil)} no {cidadeAtual.regiao}. O lugar muda escola, faculdade, trabalho e custo de vida.</p>}
          <fieldset className="campo">
            <legend className="campo__rotulo">Família em que você nasce</legend>
            <Escolha rotulo="Classe social" valor={classe} aoMudar={setClasse} opcoes={[
              { id: 'sorte', rotulo: 'Deixar ao acaso' }, { id: 'vulneravel', rotulo: 'Pobre' }, { id: 'trabalhadora', rotulo: 'Trabalhadora' },
              { id: 'media_baixa', rotulo: 'Média baixa' }, { id: 'media', rotulo: 'Média' }, { id: 'alta', rotulo: 'Rica' }
            ]} />
          </fieldset>

          <fieldset className="campo">
            <legend className="campo__rotulo">Aparência</legend>
            <label className="campo campo--check">
              <input type="checkbox" checked={heranca} onChange={e => setHeranca(e.target.checked)} />
              <span>Puxar os traços dos pais (pele, olhos, cor do cabelo)</span>
            </label>
            {!heranca && (
              <>
                <p className="amostras__rotulo" aria-hidden="true">Pele</p>
                <div className="amostras" role="radiogroup" aria-label="Tom de pele">
                  {PELES.map(p => <button key={p} type="button" role="radio" aria-checked={visual.pele === p} aria-label={`Tom ${p.slice(1)}`} className={`amostra${visual.pele === p ? ' amostra--ativa' : ''}`} style={{ background: COR_PELE[p] }} onClick={() => setVisual(v => ({ ...v, pele: p }))} />)}
                </div>
                <p className="amostras__rotulo" aria-hidden="true">Cabelo</p>
                <div className="amostras" role="radiogroup" aria-label="Cor do cabelo">
                  {CORES_CABELO.map(p => <button key={p} type="button" role="radio" aria-checked={visual.corCabelo === p} aria-label={p.replace('_', ' ')} className={`amostra${visual.corCabelo === p ? ' amostra--ativa' : ''}`} style={{ background: COR_CABELO[p] }} onClick={() => setVisual(v => ({ ...v, corCabelo: p }))} />)}
                </div>
                <p className="amostras__rotulo" aria-hidden="true">Olhos</p>
                <div className="amostras" role="radiogroup" aria-label="Cor dos olhos">
                  {CORES_OLHOS.map(p => <button key={p} type="button" role="radio" aria-checked={visual.olhos === p} aria-label={p.replace('_', ' ')} className={`amostra amostra--olho${visual.olhos === p ? ' amostra--ativa' : ''}`} style={{ background: COR_OLHO[p] }} onClick={() => setVisual(v => ({ ...v, olhos: p }))} />)}
                </div>
              </>
            )}
            <label className="campo">
              <span className="campo__rotulo">Cabelo quando crescer</span>
              <select value={visual.cabelo} onChange={e => setVisual(v => ({ ...v, cabelo: e.target.value }))}>
                {cabelos.map(cb => <option key={cb} value={cb}>{ROTULO_CABELO[cb]}</option>)}
              </select>
            </label>
            {genero === 'masculino' && (
              <label className="campo">
                <span className="campo__rotulo">Barba quando adulto</span>
                <select value={visual.barba ?? ''} onChange={e => setVisual(v => ({ ...v, barba: e.target.value || undefined }))}>
                  <option value="">Sem barba</option><option value="bigode">Bigode</option><option value="cavanhaque">Cavanhaque</option><option value="curta">Barba curta</option><option value="cheia">Barba cheia</option>
                </select>
              </label>
            )}
          </fieldset>

          <button type="submit" className="botao botao--principal criacao__nascer">Nascer</button>
        </form>
      </div>
    </div>
  );
}
