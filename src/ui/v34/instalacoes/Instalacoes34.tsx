/**
 * VIDA 34 · AS INSTALAÇÕES — a aba que mostra onde o time vive (o estádio, o CT e a base do clube; o ginásio do time de
 * quadra; a gaming house da org), desenhadas no tamanho que têm, e o ateliê para personalizar: o nome de cada lugar, a
 * cor das cadeiras, a cobertura, o gramado, o piso, a fachada, o estilo da casa, a luz. As escolhas são estéticas e
 * gratuitas; crescer (mais arquibancada, mais campos) é obra, nas ações do time.
 */
import { useState, type ReactNode } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import type { Identidade33 } from '../../../motor/v33/dono/identidade33';
import type { OpDono33 } from '../../../motor/v33/dono/dono33';
import { NOMES34, opcoes34, type Instalacoes34 } from '../../../motor/v33/dono/instalacoes34';
import { BotaoAcao } from '../../comum';
import { desenhoDoClube30, iniciaisDoClube30 } from '../../v30/escudos/Escudo30';
import { coresDaOrg34 } from '../../v31/esports/coresOrgs34';
import { Base34, capacidade34, CT34, Estadio34, Ginasio34, type Cores34 } from './Desenhos34';
import './instalacoes34.css';

type Agir = (a: Acao) => boolean;
type Lugar = 'casa' | 'ct' | 'base';
export type Tipo34 =
  | { tipo: 'clube'; estadio: number; ct: number; base: number; obra?: string }
  | { tipo: 'quadra'; ginasio: number; modalidade: 'basquete' | 'volei' | 'futsal'; obra?: boolean };


function Escolha<K extends 'cadeiras' | 'gramado' | 'cobertura' | 'piso' | 'fachada' | 'estilo' | 'parede' | 'layout'>({ k, rotulo, valor, mudar }: { k: K; rotulo: string; valor: string | undefined; mudar: (v: string) => void }) {
  return (
    <div className="inst34__escolha" role="group" aria-label={rotulo}>
      <span className="inst34__rot">{rotulo}</span>
      <div className="inst34__fichas">{opcoes34(k).map(o => <button key={o} type="button" className="inst34__ficha" aria-pressed={valor === o} onClick={() => mudar(o)}>{NOMES34[o]}</button>)}</div>
    </div>
  );
}
function Liga({ rotulo, valor, mudar }: { rotulo: string; valor: boolean; mudar: (v: boolean) => void }) {
  return <label className="inst34__liga"><input type="checkbox" checked={valor} onChange={e => mudar(e.target.checked)} /> {rotulo}</label>;
}
function Estrelas({ n }: { n: number }) { return <span className="inst34__estrelas" aria-label={`nível ${n} de 5`}>{'★'.repeat(n)}<i>{'★'.repeat(5 - n)}</i></span>; }

export function Instalacoes34({ vida, agir, nome, identidade, inst, dados, acao, org }: { vida: Vida; agir: Agir; nome: string; identidade?: Identidade33; inst?: Instalacoes34; dados: Tipo34; acao: (sub: OpDono33) => Acao; org?: boolean }) {
  const [lugar, setLugar] = useState<Lugar>('casa');
  const [r, setR] = useState<Instalacoes34>(() => ({ ...(inst ?? {}) }));
  const muda = (p: Partial<Instalacoes34>) => setR(x => ({ ...x, ...p }));
  const d = org ? null : desenhoDoClube30(nome);
  const [o1, o2] = org ? coresDaOrg34(nome) : ['', ''];
  const cores: Cores34 = identidade ? { cor1: identidade.cor1, cor2: identidade.cor2, cor3: identidade.cor3 } : d ? { cor1: d[2], cor2: d[3] } : { cor1: o1.startsWith('#') ? o1 : '#3f3f46', cor2: o2.startsWith('#') ? o2 : '#a78bfa' };
  const sigla = (identidade?.sigla || iniciaisDoClube30(nome)).slice(0, 4);
  const nomeCasaPadrao = identidade?.casa || (dados.tipo === 'clube' ? `Estádio do ${nome}` : `Ginásio do ${nome}`);
  const nomeCasa = r.nomeCasa || nomeCasaPadrao;
  const mudou = JSON.stringify(r) !== JSON.stringify(inst ?? {});

  let desenho: ReactNode; let titulo: string; let ficha: ReactNode; let nomeCampo: 'nomeCasa' | 'nomeCT' | 'nomeBase' = 'nomeCasa'; let nomeAgora = nomeCasa;
  if (dados.tipo === 'clube' && lugar === 'ct') {
    nomeCampo = 'nomeCT'; nomeAgora = r.nomeCT || `CT do ${nome}`; titulo = nomeAgora;
    desenho = <CT34 nivel={dados.ct} i={r} c={cores} nome={nomeAgora} />;
    ficha = <p className="nota">Centro de treinamento <Estrelas n={dados.ct} /> · {dados.ct} {dados.ct === 1 ? 'campo' : 'campos'}{dados.ct >= 3 ? ', academia' : ''}{dados.ct >= 4 ? ', piscina' : ''}{dados.ct >= 5 ? ', concentração' : ''}. Treino melhor, lesão mais curta.</p>;
  } else if (dados.tipo === 'clube' && lugar === 'base') {
    nomeCampo = 'nomeBase'; nomeAgora = r.nomeBase || `Base do ${nome}`; titulo = nomeAgora;
    desenho = <Base34 nivel={dados.base} i={r} c={cores} nome={nomeAgora} />;
    ficha = <p className="nota">Categorias de base <Estrelas n={dados.base} />{dados.base >= 2 ? ' · alojamento' : ''}{dados.base >= 3 ? ' · escola' : ''}{dados.base >= 4 ? ' · departamento médico' : ''}{dados.base >= 5 ? ' · análise de desempenho' : ''}. Melhor estrutura, juniores melhores.</p>;
  } else if (dados.tipo === 'clube') {
    titulo = nomeCasa;
    desenho = <Estadio34 nivel={dados.estadio} i={r} c={cores} sigla={sigla} nome={nomeCasa} />;
    ficha = <p className="nota">Estádio <Estrelas n={dados.estadio} /> · cerca de {capacidade34(dados.estadio).toLocaleString('pt-BR')} lugares{dados.obra ? ` · ${dados.obra}` : ''}. Mais lugares, mais bilheteria e torcida.</p>;
  } else {
    titulo = nomeCasa;
    desenho = <Ginasio34 nivel={dados.ginasio} modalidade={dados.modalidade} i={r} c={cores} sigla={sigla} nome={nomeCasa} />;
    ficha = <p className="nota">Ginásio <Estrelas n={dados.ginasio} /> · cerca de {[0, 800, 2000, 4500, 8000, 14000][dados.ginasio].toLocaleString('pt-BR')} lugares{dados.obra ? ' · em obra' : ''}.</p>;
  }

  return (
    <section className="inst34" aria-label="Instalações">
      {dados.tipo === 'clube' && (
        <div className="inst34__lugares" role="group" aria-label="Qual lugar">
          {(['casa', 'ct', 'base'] as Lugar[]).map(l => <button key={l} type="button" className="inst34__ficha" aria-pressed={lugar === l} onClick={() => setLugar(l)}>{l === 'casa' ? 'Estádio' : l === 'ct' ? 'Centro de treinamento' : 'Categorias de base'}</button>)}
        </div>
      )}
      <div className="inst34__palco">
        <figure className="inst34__figura">{desenho}<figcaption><strong>{titulo}</strong></figcaption></figure>
        <div className="inst34__atelie">
          {ficha}
          <h4 className="inst34__sub">Personalizar</h4>
          <label className="inst34__nome">Nome <input value={r[nomeCampo] ?? ''} maxLength={40} placeholder={nomeCampo === 'nomeCasa' ? nomeCasaPadrao : nomeAgora} onChange={e => muda({ [nomeCampo]: e.target.value })} /></label>
          {(dados.tipo === 'clube' && lugar === 'casa') && <>
            <Escolha k="cadeiras" rotulo="Cadeiras" valor={r.cadeiras ?? 'time'} mudar={v => muda({ cadeiras: v as Instalacoes34['cadeiras'] })} />
            <Escolha k="cobertura" rotulo="Cobertura" valor={r.cobertura ?? (dados.estadio >= 5 ? 'total' : 'nenhuma')} mudar={v => muda({ cobertura: v as Instalacoes34['cobertura'] })} />
            <Escolha k="gramado" rotulo="Corte do gramado" valor={r.gramado ?? 'listras'} mudar={v => muda({ gramado: v as Instalacoes34['gramado'] })} />
            <Liga rotulo="Sigla nas cadeiras" valor={r.letreiro ?? true} mudar={v => muda({ letreiro: v })} />
            <Liga rotulo="Telão" valor={r.telao ?? dados.estadio >= 4} mudar={v => muda({ telao: v })} />
          </>}
          {(dados.tipo === 'clube' && lugar !== 'casa') && <Escolha k="fachada" rotulo="Fachada dos prédios" valor={r.fachada ?? 'time'} mudar={v => muda({ fachada: v as Instalacoes34['fachada'] })} />}
          {dados.tipo === 'quadra' && <>
            <Escolha k="piso" rotulo="Piso" valor={r.piso ?? 'madeira'} mudar={v => muda({ piso: v as Instalacoes34['piso'] })} />
            <Escolha k="cadeiras" rotulo="Arquibancada" valor={r.cadeiras ?? 'time'} mudar={v => muda({ cadeiras: v as Instalacoes34['cadeiras'] })} />
            <Liga rotulo="Placar suspenso" valor={r.telao ?? dados.ginasio >= 3} mudar={v => muda({ telao: v })} />
          </>}
          <div className="inst34__salvar">
            <BotaoAcao vida={vida} agir={agir} acao={acao({ op: 'instalacoes', instalacoes: r })} variante={mudou ? 'principal' : 'secundario'}>{mudou ? 'Salvar as escolhas' : 'Escolhas salvas'}</BotaoAcao>
            {mudou && <button type="button" className="botao botao--discreto" onClick={() => setR({ ...(inst ?? {}) })}>Desfazer</button>}
          </div>
          <p className="nota">Personalizar não custa nada nem muda o desempenho. Crescer é obra: {dados.tipo === 'clube' ? 'em Estrutura e finanças' : 'em Comando (ampliar o ginásio)'}.</p>
        </div>
      </div>
    </section>
  );
}
