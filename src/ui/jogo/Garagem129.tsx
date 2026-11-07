/**
 * VIDA 12.9 — A GARAGEM À VISTA. Os veículos expostos (o desenho de cada um, com a cor, as rodas e o acabamento que
 * têm), organizados (em uso, de coleção, guardados longe, parados) e com o que importa de cada um: o que vale hoje, o que
 * custou, o que custa por mês, o estado, onde está, o que foi feito nele, a história e, quando é o caso, a raridade com o
 * fundamento dela (a tiragem, quantos se fizeram) e o lugar na coleção. Nada aqui calcula regra: os números são os do
 * motor; personalizar abre o painel de sempre, já no veículo escolhido.
 */
import { useState } from 'react';
import type { Acao } from '../../motor/acoes';
import type { Veiculo, Vida } from '../../motor/tipos';
import { anoDe } from '../../motor/tempo';
import { idade } from '../../motor/nucleo';
import { formaDaVersao, modeloVeiculo, NOME_FORMA, versaoVeiculo } from '../../motor/dados/bens';
import { economiaLocal, municipio } from '../../motor/dados/lugares';
import { corDoVeiculo } from '../../motor/dados/pertences';
import { opcaoDaPeca, pecasDaCategoria } from '../../motor/dados/personalizacaoVeiculo';
import { fundamentoDaRaridade, grauDoVeiculo } from '../../motor/dados/veiculos129';
import { NOME_GRAU, ORDEM_DO_GRAU } from '../../motor/dados/colecao128';
import { custosDeVeiculo, estadoDoVeiculo, guardadoLonge, nomeComCor, ondeEsta } from '../../motor/sistemas/veiculos';
import { dinheiroCurto } from '../leituraMaterial';
import { DesenhoVeiculo } from './material/Desenhos';
import { PersonalizarVeiculos } from './Personalizar';
import { Folha } from '../comum';
import '../garagem129.css';

interface Props { vida: Vida; agir: (a: Acao) => boolean }

type Filtro = 'todos' | 'uso' | 'colecao' | 'longe' | 'parados';
type Ordem = 'valor' | 'ano' | 'raridade' | 'nome';
const NOME_FILTRO: Record<Filtro, string> = { todos: 'Todos', uso: 'Em uso', colecao: 'De coleção', longe: 'Guardados longe', parados: 'Parados' };
const NOME_ORDEM: Record<Ordem, string> = { valor: 'Valor', ano: 'Ano', raridade: 'Raridade', nome: 'Nome' };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const grauDe = (b: Veiculo) => grauDoVeiculo(versaoVeiculo(b.versaoId), modeloVeiculo(b.modeloId).segmento);
/**
 * VIDA 13: a escala da exposição. Os carros já vêm na escala deles (o Mobi é menor que o Phantom no mesmo quadro); a moto
 * e a bicicleta, desenhadas para encher o quadro, encolhem para o tamanho de verdade ao lado de um carro.
 */
const ESCALA: Record<string, number> = { moto: 0.52, bicicleta: 0.44 };
const escalaDe = (b: Veiculo) => ESCALA[modeloVeiculo(b.modeloId).categoria] ?? 1;
type Tipo = 'todos' | 'carro' | 'moto' | 'bicicleta' | 'embarcacao' | 'aeronave';
const NOME_TIPO: Record<Tipo, string> = { todos: 'Todos os tipos', carro: 'Carros', moto: 'Motos', bicicleta: 'Bicicletas', embarcacao: 'Barcos', aeronave: 'Aeronaves' };
const passa = (v: Vida, b: Veiculo, f: Filtro) => f === 'todos' || (f === 'colecao' ? b.papel === 'colecao' : f === 'longe' ? guardadoLonge(v, b) : f === 'parados' ? !!b.parado && b.papel !== 'colecao' : !b.papel && !b.parado && !guardadoLonge(v, b));

/** As peças feitas, em palavras ("Rodas: forjadas douradas"). */
function pecasFeitas(b: Veiculo): string[] {
  const cat = modeloVeiculo(b.modeloId).categoria;
  return Object.entries(b.mods ?? {}).filter(([k]) => k !== '_fabrica').map(([peca, op]) => {
    const p = pecasDaCategoria(cat).find(x => x.id === peca);
    const o = opcaoDaPeca(cat, peca, op);
    return p && o ? `${p.nome}: ${o.nome.replace(/ \(.*\)$/, '')}` : '';
  }).filter(Boolean);
}

export function GaragemVisual({ vida, agir }: Props) {
  const lista = vida.financas.bens.filter((b): b is Veiculo => b.tipo === 'veiculo');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [ordem, setOrdem] = useState<Ordem>('valor');
  const [personalizar, setPersonalizar] = useState<string | null>(null);
  const [tipo, setTipo] = useState<Tipo>('todos');
  const [ampliado, setAmpliado] = useState<string | null>(null);
  if (!lista.length) return null;
  const c = economiaLocal(vida.moradia.municipioId).custo;
  const custo = (b: Veiculo) => custosDeVeiculo(vida, b, c, vida.financas.veiculoPrincipal === b.id ? 1 : 0.7).reduce((s, x) => s + x.valor, 0);
  const filtros = (Object.keys(NOME_FILTRO) as Filtro[]).filter(f => f === 'todos' || lista.some(b => passa(vida, b, f)));
  const tipos = (Object.keys(NOME_TIPO) as Tipo[]).filter(t => t === 'todos' || lista.some(b => modeloVeiculo(b.modeloId).categoria === t));
  const visiveis = lista.filter(b => passa(vida, b, filtro) && (tipo === 'todos' || modeloVeiculo(b.modeloId).categoria === tipo)).sort((a, b) =>
    ordem === 'ano' ? (b.anoFabricacao ?? 0) - (a.anoFabricacao ?? 0)
      : ordem === 'raridade' ? ORDEM_DO_GRAU.indexOf(grauDe(b)) - ORDEM_DO_GRAU.indexOf(grauDe(a)) || b.valor - a.valor
        : ordem === 'nome' ? nomeComCor(a).localeCompare(nomeComCor(b), 'pt-BR') : b.valor - a.valor);
  const total = lista.reduce((s, b) => s + b.valor, 0);
  const mensal = lista.reduce((s, b) => s + custo(b), 0);
  const deColecao = lista.filter(b => b.papel === 'colecao').length;
  return (
    <div className="gar129" aria-label="Seus veículos, expostos" role="region">
      <p className="gar129__resumo nota">
        {lista.length} {lista.length === 1 ? 'veículo' : 'veículos'} · valem uns {dinheiroCurto(total)} · custam uns {dinheiroCurto(mensal)} por mês{deColecao ? ` · ${deColecao} de coleção` : ''}
      </p>
      {/* A cena: todos lado a lado, no chão da garagem, na escala de verdade (os de coleção, à frente). Tocar abre de perto. */}
      <div className="gar129__cena" role="group" aria-label="A garagem">
        {[...lista].sort((a, b) => (b.papel === 'colecao' ? 1 : 0) - (a.papel === 'colecao' ? 1 : 0)).slice(0, 8).map(b => {
          const forma = formaDaVersao(versaoVeiculo(b.versaoId), b.modeloId);
          const base = lista.length > 4 ? 132 : 160;
          return (
            <button type="button" key={b.id} className={`gar129__vaga${b.papel === 'colecao' ? ' gar129__vaga--colecao' : ''}`} onClick={() => setAmpliado(b.id)} aria-label={`Ver de perto: ${nomeComCor(b)}`}>
              <DesenhoVeiculo forma={forma} semente={b.id} versaoId={b.versaoId} cor={corDoVeiculo(b, modeloVeiculo(b.modeloId).categoria).cor} estado={b.estado} mods={b.mods} largura={Math.round(base * escalaDe(b))} />
            </button>
          );
        })}
        {lista.length > 8 && <span className="gar129__mais-vagas nota">+{lista.length - 8} na lista abaixo</span>}
      </div>
      {lista.length > 1 && (
        <div className="gar129__organizar">
          <div className="escolha" role="radiogroup" aria-label="Mostrar">
            {filtros.map(f => <button key={f} type="button" role="radio" aria-checked={filtro === f} className={`escolha__item${filtro === f ? ' escolha__item--ativo' : ''}`} onClick={() => setFiltro(f)}>{NOME_FILTRO[f]}</button>)}
          </div>
          {tipos.length > 2 && (
            <label className="campo gar129__ordem"><span className="campo__rotulo">Tipo</span>
              <select value={tipo} onChange={e => setTipo(e.target.value as Tipo)}>{tipos.map(t => <option key={t} value={t}>{NOME_TIPO[t]}</option>)}</select>
            </label>
          )}
          <label className="campo gar129__ordem"><span className="campo__rotulo">Ordenar por</span>
            <select value={ordem} onChange={e => setOrdem(e.target.value as Ordem)}>{(Object.keys(NOME_ORDEM) as Ordem[]).map(o => <option key={o} value={o}>{NOME_ORDEM[o]}</option>)}</select>
          </label>
        </div>
      )}
      <ul className="gar129__cartoes">
        {visiveis.map(b => <Cartao key={b.id} vida={vida} b={b} custo={custo(b)} aoPersonalizar={() => setPersonalizar(b.id)} aoAmpliar={() => setAmpliado(b.id)} />)}
      </ul>
      {ampliado && (() => { const b = lista.find(x => x.id === ampliado); return b ? <DePerto vida={vida} b={b} aoFechar={() => setAmpliado(null)} aoPersonalizar={() => { setAmpliado(null); setPersonalizar(b.id); }} /> : null; })()}
      {personalizar && <PersonalizarVeiculos key={personalizar} vida={vida} agir={agir} inicial={personalizar} aoFechar={() => setPersonalizar(null)} />}
      {!personalizar && <PersonalizarVeiculos vida={vida} agir={agir} />}
    </div>
  );
}

/** VIDA 13: o veículo de perto — o desenho grande, com a cor, as rodas, o acabamento e o que foi feito nele. */
function DePerto({ vida, b, aoFechar, aoPersonalizar }: { vida: Vida; b: Veiculo; aoFechar: () => void; aoPersonalizar: () => void }) {
  const m = modeloVeiculo(b.modeloId);
  const forma = formaDaVersao(versaoVeiculo(b.versaoId), b.modeloId);
  const cor = corDoVeiculo(b, m.categoria);
  const pecas = pecasFeitas(b);
  return (
    <Folha titulo={cap(nomeComCor(b))} rotulo={`De perto: ${nomeComCor(b)}`} aoFechar={aoFechar} largura="larga">
      <div className="gar129__perto" data-veiculo={b.id}>
        <DesenhoVeiculo forma={forma} semente={b.id} versaoId={b.versaoId} cor={cor.cor} estado={b.estado} mods={b.mods} largura={720} rotulo={`${NOME_FORMA[forma]}${cor.nome ? `, ${cor.nome}` : ''}${pecas.length ? `, ${pecas.join(', ')}` : ''}`} />
      </div>
      <p className="nota gar129__perto-legenda">{cap(NOME_FORMA[forma])}{b.anoFabricacao ? `, ${b.anoFabricacao}` : ''} · {estadoDoVeiculo(b)}{pecas.length ? ` · ${pecas.join(' · ')}` : ' · como saiu de fábrica'}</p>
      {idade(vida) >= 18 && <button type="button" className="botao botao--discreto" onClick={aoPersonalizar}>Personalizar</button>}
    </Folha>
  );
}

function Cartao({ vida, b, custo, aoPersonalizar, aoAmpliar }: { vida: Vida; b: Veiculo; custo: number; aoPersonalizar: () => void; aoAmpliar: () => void }) {
  const m = modeloVeiculo(b.modeloId);
  const x = versaoVeiculo(b.versaoId);
  const forma = formaDaVersao(x, b.modeloId);
  const cor = corDoVeiculo(b, m.categoria);
  const grau = grauDe(b);
  const notavel = grau !== 'comum' || !!m.segmento;
  const pago = b.precoPago;
  const variacao = pago ? (b.valor - pago) / pago : undefined;
  const pecas = pecasFeitas(b);
  const historia = (b.historia ?? []).slice(-4).reverse();
  return (
    <li className={`gar129__cartao${b.papel === 'colecao' ? ' gar129__cartao--colecao' : ''}`} data-veiculo={b.id}>
      <button type="button" className="gar129__desenho" onClick={aoAmpliar} aria-label={`Ver de perto: ${nomeComCor(b)}`}>
        <DesenhoVeiculo forma={forma} semente={b.id} versaoId={b.versaoId} cor={cor.cor} estado={b.estado} mods={b.mods} largura={200} rotulo={`${NOME_FORMA[forma]}${cor.nome ? `, ${cor.nome}` : ''}`} />
      </button>
      <div className="gar129__corpo">
        <p className="gar129__nome">
          <strong>{cap(nomeComCor(b))}</strong>{b.anoFabricacao ? <span className="nota"> · {b.anoFabricacao}</span> : null}
          {b.apelido ? <span className="nota"> · “{b.apelido}”</span> : null}
        </p>
        <p className="gar129__selos">
          {vida.financas.veiculoPrincipal === b.id && <span className="pat-selo">principal</span>}
          {b.papel === 'colecao' && <span className="pat-selo">de coleção</span>}
          {m.segmento === 'classico' && <span className="pat-selo">clássico</span>}
          {notavel && <span className={`pat-grau pat-grau--${grau}`}>{NOME_GRAU[grau]}</span>}
        </p>
        <dl className="gar129__dados">
          <div><dt>Vale hoje</dt><dd>{dinheiroCurto(b.valor)}</dd></div>
          {pago ? <div><dt>Custou</dt><dd>{dinheiroCurto(pago)}{variacao !== undefined && Math.abs(variacao) >= 0.01 ? <span className={variacao >= 0 ? 'gar129__mais' : 'gar129__menos'}> ({variacao >= 0 ? '+' : '−'}{Math.round(Math.abs(variacao) * 100)}%)</span> : null}</dd></div> : null}
          <div><dt>Por mês</dt><dd>{dinheiroCurto(custo)}</dd></div>
          <div><dt>Estado</dt><dd>{estadoDoVeiculo(b)}</dd></div>
          <div><dt>Onde</dt><dd>{guardadoLonge(vida, b) ? `guardado em ${municipio(ondeEsta(vida, b)).nome}` : b.garagem ? 'em outra garagem sua' : 'com você'}</dd></div>
          {b.tCompra !== undefined && <div><dt>Desde</dt><dd>{anoDe(b.tCompra)}</dd></div>}
        </dl>
        {notavel && <p className="nota gar129__raridade">{cap(fundamentoDaRaridade(x, m.segmento))}{b.papel === 'colecao' ? ` · na coleção de ${m.categoria === 'moto' ? 'motos' : 'carros'}` : ''}.</p>}
        {pecas.length > 0 && <p className="nota gar129__pecas">{pecas.join(' · ')}</p>}
        {historia.length > 0 && (
          <details className="detalhes gar129__historia">
            <summary>História ({(b.historia ?? []).length})</summary>
            <ol>{historia.map((h, k) => <li key={k}><span className="nota">{anoDe(h.t)}</span> {h.texto}</li>)}</ol>
          </details>
        )}
        {idade(vida) >= 18 && (
          <button type="button" className="botao botao--discreto" onClick={aoPersonalizar}>Personalizar</button>
        )}
      </div>
    </li>
  );
}
