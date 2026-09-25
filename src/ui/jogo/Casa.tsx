/**
 * Casa e dinheiro: como esta pessoa vive materialmente.
 *
 * A ordem responde, de relance: onde eu moro e com quem (a cena); de quem é
 * a casa e quanto custa (os selos); quanto entra, quanto pesa e o que sobra
 * (a balança do mês); estou seguro ou apertado (a escala); o que tenho e o
 * que devo (o balanço); e cada bem como coisa que existe — com estado,
 * história e o que dá para fazer com ele. Comprar, alugar, investir e adotar
 * acontecem nos LUGARES (imobiliária, concessionária, banco, abrigo), não
 * numa tabela global.
 */

import { useMemo, useState } from 'react';
import type { Aplicacao, Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { economiaLocal, MUNICIPIOS, NOMES_UF, nomeLugar } from '../../motor/dados/lugares';
import { arranjoDaCasa, balanco } from '../../motor/sistemas/dinheiro';
import { moraComFamiliaDeOrigem } from '../../motor/sistemas/domicilio';
import { custoDeMudanca } from '../../motor/sistemas/processos';
import { produto, PALAVRA_RISCO } from '../../motor/dados/investimentos';
import { resultado } from '../../motor/sistemas/investimentos';
import { BotaoAcao, Secao } from '../comum';
import { lugarDescrito } from '../apresentar';
import { CenaDaCasa, Evolucao, Icone } from './material/Desenhos';
import { Lugar, type QualLugar } from './material/Lugares';
import { dinheiroCheio, dinheiroCurto, leituraDaSeguranca, leituraDoLar, leituraDosBens, type LeituraBem } from '../leituraMaterial';
import '../material.css';

interface Props { vida: Vida; agir: (a: Acao) => boolean }

export function Casa({ vida, agir }: Props) {
  const i = idade(vida);
  const [lugar, setLugar] = useState<QualLugar | null>(null);
  return (
    <div className="casa material">
      <Lar vida={vida} agir={agir} abrir={setLugar} />
      {i >= 16 && <OQueTem vida={vida} agir={agir} abrir={setLugar} />}
      {i >= 16 && <Lugares vida={vida} agir={agir} abrir={setLugar} />}
      {i >= 18 && <Mudar vida={vida} agir={agir} />}
      {lugar && <Lugar vida={vida} agir={agir} qual={lugar} aoFechar={() => setLugar(null)} trocar={setLugar} />}
    </div>
  );
}

/* ------------------------------------------------------------------ Lar */

function Lar({ vida, agir, abrir }: Props & { abrir: (l: QualLugar) => void }) {
  const l = leituraDoLar(vida);
  const naFamilia = moraComFamiliaDeOrigem(vida);
  const i = idade(vida);
  return (
    <section className="lar" aria-label="Onde você mora">
      <CenaDaCasa l={l} />
      <div className="lar__texto">
        <p className="folio__kicker"><span className="folio__area">Casa</span> · {l.onde}</p>
        <h1 className="lar__frase">{l.frase}</h1>
        {l.selos.length > 0 && (
          <ul className="selos" aria-label="Sobre a casa">
            {l.selos.map((s, k) => <li key={k} className={`selo${s.tom ? ` selo--${s.tom}` : ''}`}>{s.tom === 'ruim' && <span aria-hidden>! </span>}{s.texto}</li>)}
          </ul>
        )}
        {i >= 18 && (
          <div className="lar__acoes">
            <button type="button" className="botao botao--secundario" onClick={() => abrir('alugar')}>{naFamilia ? 'Procurar um lugar para morar' : 'Procurar outro lugar'}</button>
            {!naFamilia && !['casados', 'juntos'].includes(arranjoDaCasa(vida)) && <BotaoAcao vida={vida} acao={{ tipo: 'voltar_pais' }} agir={agir} variante="discreto" ocultarBloqueado>Voltar para a casa da família</BotaoAcao>}
          </div>
        )}
      </div>
    </section>
  );
}

function Seguranca({ s }: { s: ReturnType<typeof leituraDaSeguranca> }) {
  if (s.marca < 0) return null;
  return (
    <div className={`seguranca seguranca--${s.nivel}`} title={s.texto}>
      <span className="escala" aria-hidden>{[0, 1, 2, 3, 4].map(k => <span key={k} className={`escala__marca${k <= s.marca ? ' escala__marca--cheia' : ''}`} />)}</span>
      <span className="seguranca__palavra">{s.palavra}</span>
      <span className="sr-only">: {s.texto}</span>
    </div>
  );
}

/* ------------------------------------------------ O que tem, o que deve */

function OQueTem({ vida, agir, abrir }: Props & { abrir: (l: QualLugar) => void }) {
  const b = balanco(vida);
  const bens = leituraDosBens(vida);
  const seg = leituraDaSeguranca(vida);
  const f = vida.financas;
  const hist = f.historico.map(h => h.ativos - h.obrigacoes);
  const outras = f.dividas.filter(d => !d.bemId);
  const nada = b.ativos <= 0 && b.obrigacoes <= 0;
  const blocos = [
    { id: 'imoveis', rotulo: 'Imóveis', valor: b.imoveis },
    { id: 'veiculos', rotulo: 'Veículos', valor: b.veiculos },
    { id: 'aplicacoes', rotulo: 'Guardado e aplicado', valor: b.aplicacoes },
    { id: 'negocio', rotulo: 'Caixa do negócio', valor: b.negocio },
    { id: 'conta', rotulo: 'Na conta', valor: Math.max(0, b.conta) }
  ].filter(x => x.valor > 0);
  const deve = [
    { id: 'financiamentos', rotulo: 'Financiamentos', valor: b.financiamentos, tipo: 'financiamento' },
    { id: 'emprestimos', rotulo: 'Empréstimos', valor: b.emprestimos, tipo: 'parcela' },
    { id: 'cartao', rotulo: 'Cartão, cobrança', valor: b.cartao, tipo: 'problema' }
  ].filter(x => x.valor > 0);
  const maior = Math.max(b.ativos, b.obrigacoes, 1);
  return (
    <Secao titulo="O que você tem e o que deve" extra={<Seguranca s={seg} />}>
      {nada ? <p className="nota">{idade(vida) < 18 ? 'Ainda nada no seu nome.' : 'Nada no seu nome — nem dívida.'}</p> : (
        <>
          <div className="balanco" role="group" aria-label={`Tem ${dinheiroCheio(b.ativos)}; deve ${dinheiroCheio(b.obrigacoes)}; descontado, ${dinheiroCheio(b.liquido)}.`}>
            <div className="balanco__coluna">
              <span className="rotulo-pequeno">Tem · {dinheiroCurto(b.ativos)}</span>
              <div className="balanco__pilha" style={{ height: `${Math.max(12, (b.ativos / maior) * 100)}%` }}>
                {blocos.map(x => <div key={x.id} className={`balanco__bloco balanco__bloco--${x.id}`} style={{ flexGrow: x.valor }}><span>{x.rotulo}</span><strong>{dinheiroCurto(x.valor)}</strong></div>)}
              </div>
            </div>
            <div className="balanco__coluna balanco__coluna--deve">
              <span className="rotulo-pequeno">Deve · {dinheiroCurto(b.obrigacoes)}</span>
              {deve.length ? (
                <div className="balanco__pilha" style={{ height: `${Math.max(12, (b.obrigacoes / maior) * 100)}%` }}>
                  {deve.map(x => <div key={x.id} className={`balanco__bloco balanco__bloco--${x.tipo}`} style={{ flexGrow: x.valor }}><span>{x.rotulo}</span><strong>{dinheiroCurto(x.valor)}</strong></div>)}
                </div>
              ) : <p className="nota balanco__nada">Nenhuma dívida.</p>}
            </div>
          </div>
          {b.financiamentos > 0 && <p className="nota">Financiamento é obrigação presa a um bem: enquanto paga, a parte que já é sua cresce.</p>}
          <p className="balanco__liquido">Descontado o que deve: <strong>{dinheiroCheio(b.liquido)}</strong> <span className="nota">(patrimônio líquido)</span></p>
          {hist.length >= 3 && <Evolucao valores={hist} rotulo={`Patrimônio líquido ao longo dos últimos ${hist.length} anos: de ${dinheiroCurto(hist[0])} para ${dinheiroCurto(hist[hist.length - 1])}.`} />}
          <p className="nota">{seg.texto}</p>
        </>
      )}

      {bens.length > 0 && (
        <div className="objetos">
          {bens.map(x => <Objeto key={x.id} vida={vida} agir={agir} b={x} />)}
        </div>
      )}

      <Aplicacoes vida={vida} abrir={abrir} />

      {outras.length > 0 && (
        <div className="dividas">
          <h3 className="subtitulo">Parcelas e dívidas</h3>
          <ul>
            {outras.map(d => (
              <li key={d.id} className={`divida divida--${d.tipo === 'cartao' ? 'problema' : (d.atraso ?? 0) > 0 ? 'atrasada' : 'em-dia'}`}>
                <div>
                  <strong>{d.descricao}</strong>
                  <span>{d.tipo === 'cartao' ? `Rotativo: ${dinheiroCheio(d.saldo)} crescendo com juros${f.negativado ? ' de mora' : ' altos'}.` : `Faltam ${dinheiroCheio(d.saldo)} · ${dinheiroCheio(d.parcela)} por mês${(d.atraso ?? 0) > 0 ? ` · ${Math.ceil(d.atraso!)} ${Math.ceil(d.atraso!) === 1 ? 'mês' : 'meses'} em atraso` : ' · em dia'}.`}</span>
                </div>
              </li>
            ))}
          </ul>
          <BotaoAcao vida={vida} acao={{ tipo: 'renegociar' }} agir={agir} ocultarImpossivel>Renegociar as dívidas caras</BotaoAcao>
        </div>
      )}
      {f.negativado && <p className="nota nota--ruim"><span aria-hidden>! </span>O nome está sujo: nada de crédito nem financiamento até acertar (ou até a dívida velha caducar).</p>}
    </Secao>
  );
}

function Objeto({ vida, agir, b }: Props & { b: LeituraBem }) {
  const [valor, setValor] = useState(0);
  const f = b.financiamento;
  return (
    <article className={`objeto objeto--${b.tipo}`}>
      <div className="objeto__cabeca">
        <Icone nome={b.icone} />
        <div className="objeto__nome">
          <h3>{b.titulo}</h3>
          <p>{b.meta}</p>
        </div>
      </div>
      <p className="objeto__estado">{b.estado}</p>
      <dl className="objeto__numeros">
        <div><dt>Vale hoje</dt><dd>{dinheiroCurto(b.valor)}</dd></div>
        {f && <div><dt>Falta pagar</dt><dd>{dinheiroCurto(f.saldo)}</dd></div>}
        {f && <div><dt>Parcela</dt><dd>{dinheiroCurto(f.parcela)}/mês · {f.anos} {f.anos === 1 ? 'ano' : 'anos'}</dd></div>}
        {f && <div><dt>Já é seu</dt><dd>{dinheiroCurto(f.suaParte)}</dd></div>}
      </dl>
      {f && f.atraso > 0 && <p className="nota nota--ruim"><span aria-hidden>! </span>{f.atraso} {f.atraso === 1 ? 'mês' : 'meses'} de parcela atrasada.</p>}
      {b.problema && (
        <div className={`objeto__problema${b.problema.grave ? ' objeto__problema--grave' : ''}`}>
          <p><strong>{b.problema.grave ? 'Parado: ' : 'Precisa de conserto: '}</strong>{b.problema.texto}, {dinheiroCheio(b.problema.custo)}{b.problema.adiado ? ` (já adiado ${b.problema.adiado === 1 ? 'uma vez' : `${b.problema.adiado} vezes`})` : ''}.</p>
          <div className="grupo-acoes grupo-acoes--linha">
            {b.tipo === 'veiculo'
              ? <><BotaoAcao vida={vida} acao={{ tipo: 'veiculo', bemId: b.id, oque: 'consertar' }} agir={agir}>Consertar</BotaoAcao><BotaoAcao vida={vida} acao={{ tipo: 'veiculo', bemId: b.id, oque: 'adiar' }} agir={agir} variante="discreto" ocultarBloqueado>Adiar</BotaoAcao><BotaoAcao vida={vida} acao={{ tipo: 'veiculo', bemId: b.id, oque: 'parar' }} agir={agir} variante="discreto" ocultarBloqueado>Deixar parado</BotaoAcao></>
              : <><BotaoAcao vida={vida} acao={{ tipo: 'imovel', bemId: b.id, oque: 'reparar' }} agir={agir}>Reparar</BotaoAcao><BotaoAcao vida={vida} acao={{ tipo: 'imovel', bemId: b.id, oque: 'adiar' }} agir={agir} variante="discreto" ocultarBloqueado>Deixar para depois</BotaoAcao></>}
          </div>
        </div>
      )}
      <div className="grupo-acoes grupo-acoes--linha objeto__acoes">
        {b.tipo === 'veiculo' && <BotaoAcao vida={vida} acao={{ tipo: 'veiculo', bemId: b.id, oque: 'revisao' }} agir={agir} variante="discreto" ocultarBloqueado>Fazer a revisão</BotaoAcao>}
        {b.tipo === 'veiculo' && <BotaoAcao vida={vida} acao={{ tipo: 'veiculo', bemId: b.id, oque: 'usar' }} agir={agir} variante="discreto" ocultarBloqueado>Voltar a usar</BotaoAcao>}
        {b.tipo === 'imovel' && <BotaoAcao vida={vida} acao={{ tipo: 'imovel', bemId: b.id, oque: 'morar' }} agir={agir} variante="discreto" ocultarBloqueado>Morar aqui</BotaoAcao>}
        {b.tipo === 'imovel' && <BotaoAcao vida={vida} acao={{ tipo: 'imovel', bemId: b.id, oque: 'alugar' }} agir={agir} variante="discreto" ocultarBloqueado>Alugar para alguém</BotaoAcao>}
        {b.tipo === 'imovel' && <BotaoAcao vida={vida} acao={{ tipo: 'imovel', bemId: b.id, oque: 'retomar' }} agir={agir} variante="discreto" ocultarBloqueado>Pedir o imóvel de volta</BotaoAcao>}
        {f && <BotaoAcao vida={vida} acao={{ tipo: 'renegociar_financiamento', dividaId: f.dividaId }} agir={agir} variante="discreto" ocultarBloqueado>Renegociar a parcela</BotaoAcao>}
        <BotaoAcao vida={vida} acao={{ tipo: 'vender_bem', bemId: b.id }} agir={agir} variante="discreto">Vender</BotaoAcao>
      </div>
      {f && vida.financas.conta > 1000 && (
        <div className="objeto__amortizar">
          <label className="campo">
            <span className="campo__rotulo">Adiantar parcelas</span>
            <input type="number" inputMode="numeric" min={0} step={1000} value={valor || ''} placeholder="valor em reais" onChange={e => setValor(Math.max(0, Math.round(Number(e.target.value))))} />
          </label>
          <BotaoAcao vida={vida} acao={{ tipo: 'amortizar', dividaId: f.dividaId, valor }} agir={agir} variante="discreto" aoAgir={() => setValor(0)}>Amortizar</BotaoAcao>
        </div>
      )}
      {b.historia.length > 0 && (
        <details className="detalhes objeto__historia">
          <summary>A história {b.tipo === 'imovel' ? 'da casa' : 'dele'}</summary>
          <ol>{b.historia.map((h, k) => <li key={k}><span>{h.ano}</span> {h.texto}</li>)}</ol>
        </details>
      )}
    </article>
  );
}

/* ------------------------------------------------------------- Aplicações */

function Aplicacoes({ vida, abrir }: { vida: Vida; abrir: (l: QualLugar) => void }) {
  const lista = vida.financas.investimentos;
  if (!lista.length) {
    if (idade(vida) < 18) return null;
    return (
      <div className="aplicacoes aplicacoes--vazio">
        <h3 className="subtitulo">Guardado</h3>
        <p className="nota">Nada aplicado. Dinheiro parado na conta perde para a inflação todo ano.</p>
        <button type="button" className="botao botao--secundario" onClick={() => abrir('banco')}>Ver onde guardar</button>
      </div>
    );
  }
  return (
    <div className="aplicacoes">
      <h3 className="subtitulo">Guardado e aplicado</h3>
      {lista.map(a => <CartaoAplicacao key={a.id} a={a} />)}
      <button type="button" className="botao botao--secundario" onClick={() => abrir('banco')}>Pôr ou tirar dinheiro</button>
    </div>
  );
}

function CartaoAplicacao({ a }: { a: Aplicacao }) {
  const p = produto(a.produto);
  const r = resultado(a);
  const pct = a.aportado > 0 ? r / a.aportado : 0;
  const ano = a.retornoAno;
  return (
    <article className="aplicacao">
      <div className="aplicacao__cabeca">
        <h4>{p.nome}</h4>
        <span className="aplicacao__risco"><span className="escala escala--pequena" aria-hidden>{[1, 2, 3, 4, 5].map(k => <span key={k} className={`escala__marca${k <= p.risco ? ' escala__marca--cheia' : ''}`} />)}</span>{PALAVRA_RISCO[p.risco]}</span>
      </div>
      <dl className="objeto__numeros">
        <div><dt>Você pôs</dt><dd>{dinheiroCurto(a.aportado)}</dd></div>
        <div><dt>Vale hoje</dt><dd>{dinheiroCurto(a.valor)}</dd></div>
        <div><dt>{r >= 0 ? 'Ganhou' : 'Perdeu'}</dt><dd className={r >= 0 ? 'ganho' : 'perda'}>{r >= 0 ? '+' : '−'} {dinheiroCurto(Math.abs(r))} <small>({r >= 0 ? '+' : '−'}{Math.abs(Math.round(pct * 100))}%)</small></dd></div>
        {ano !== undefined && <div><dt>No último ano</dt><dd className={ano >= 0 ? 'ganho' : 'perda'}>{ano >= 0 ? 'subiu' : 'caiu'} {Math.abs(Math.round(ano * 1000) / 10).toString().replace('.', ',')}%</dd></div>}
      </dl>
      {a.historico.length >= 3 && <Evolucao valores={a.historico} rotulo={`Evolução de ${p.nome.toLowerCase()}: de ${dinheiroCurto(a.historico[0])} para ${dinheiroCurto(a.valor)}.`} altura={32} />}
      <p className="nota">{a.rendaAno ? `Pagou ${dinheiroCurto(a.rendaAno)} na conta no último ano (${p.renda?.toLowerCase().replace(/\.$/, '')}). ` : p.renda ? '' : 'Não paga renda: o rendimento fica dentro. '}{p.liquidez}</p>
    </article>
  );
}

/* ------------------------------------------------------------- Lugares */

function Lugares({ vida, agir, abrir }: Props & { abrir: (l: QualLugar) => void }) {
  const i = idade(vida);
  const temVeiculo = vida.financas.bens.some(b => b.tipo === 'veiculo');
  const lugares: { id: QualLugar; nome: string; oque: string; icone: string; so18?: boolean }[] = [
    { id: 'alugar', nome: 'Imobiliária', oque: 'Alugar ou comprar', icone: 'imobiliaria', so18: true },
    { id: 'concessionaria', nome: 'Concessionária', oque: 'Carros zero', icone: 'concessionaria', so18: true },
    { id: 'usados', nome: 'Usados', oque: 'Anúncios de carros', icone: 'usados', so18: true },
    { id: 'motos', nome: 'Motos e bicicletas', oque: 'Novas e usadas', icone: 'bicicleta' },
    ...(temVeiculo ? [{ id: 'oficina' as QualLugar, nome: 'Oficina', oque: 'Revisão e conserto', icone: 'oficina' }] : []),
    { id: 'banco', nome: 'Banco', oque: 'Guardar, investir, empréstimo', icone: 'banco', so18: true },
    { id: 'abrigo', nome: 'Abrigo de animais', oque: 'Adotar', icone: 'abrigo', so18: true }
  ];
  return (
    <Secao titulo="Pela cidade" recolhivel aberta={i >= 18}>
      <p className="nota">Onde se procura casa, carro, um lugar para guardar dinheiro — e um bicho.</p>
      {i >= 18 && <BotaoAcao vida={vida} acao={{ tipo: 'cnh' }} agir={agir} variante="discreto" ocultarBloqueado>Tirar carteira de motorista</BotaoAcao>}
      <ul className="lugares">
        {lugares.filter(l => !l.so18 || i >= 18).map(l => (
          <li key={l.id}>
            <button type="button" className="lugar-botao" onClick={() => abrir(l.id)}>
              <Icone nome={l.icone} tamanho={26} />
              <span className="lugar-botao__nome">{l.nome}</span>
              <span className="lugar-botao__oque">{l.oque}</span>
            </button>
          </li>
        ))}
      </ul>
    </Secao>
  );
}

/* --------------------------------------------------------- Mudar de cidade */

function Mudar({ vida, agir }: Props) {
  const [uf, setUf] = useState('');
  const [destino, setDestino] = useState('');
  const ufs = useMemo(() => [...new Set(MUNICIPIOS.map(m => m.uf))].sort((a, b) => NOMES_UF[a].localeCompare(NOMES_UF[b])), []);
  const cidades = MUNICIPIOS.filter(m => m.uf === uf && m.id !== vida.moradia.municipioId);
  const aqui = economiaLocal(vida.moradia.municipioId);
  return (
    <Secao titulo="Mudar de cidade" recolhivel aberta={false}>
      <p className="nota">Mudar leva quem mora com você e deixa o resto para trás: o emprego local acaba, os amigos ficam longe. A casa própria fica (dá para alugar ou vender); no destino, começa-se de aluguel.</p>
      <div className="campos-linha">
        <label className="campo">
          <span className="campo__rotulo">Estado</span>
          <select value={uf} onChange={e => { setUf(e.target.value); setDestino(''); }}>
            <option value="">Escolha</option>
            {ufs.map(u => <option key={u} value={u}>{NOMES_UF[u]}</option>)}
          </select>
        </label>
        <label className="campo">
          <span className="campo__rotulo">Cidade</span>
          <select value={destino} onChange={e => setDestino(e.target.value)} disabled={!uf}>
            <option value="">Escolha</option>
            {cidades.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </label>
      </div>
      {destino && (
        <>
          <p className="nota">{lugarDescrito(destino)}. Custo de vida {economiaLocal(destino).custo > aqui.custo ? 'maior' : 'menor'} que o daqui; salários {economiaLocal(destino).salario > aqui.salario ? 'maiores' : 'menores'}; aluguel de referência {dinheiroCurto(economiaLocal(destino).aluguel)} (aqui, {dinheiroCurto(aqui.aluguel)}). A mudança custa cerca de {dinheiroCurto(custoDeMudanca(vida.moradia.municipioId, destino))}.</p>
          <BotaoAcao vida={vida} acao={{ tipo: 'mudar_cidade', municipioId: destino }} agir={agir} aoAgir={() => { setUf(''); setDestino(''); }}>Mudar para {nomeLugar(destino)}</BotaoAcao>
        </>
      )}
    </Secao>
  );
}
