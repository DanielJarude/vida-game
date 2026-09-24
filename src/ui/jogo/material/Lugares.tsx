/**
 * Os lugares da cidade: imobiliária, concessionária, usados, motos e
 * bicicletas, oficina, banco, abrigo. Cada um mostra primeiro o que faz
 * sentido para esta vida (com o motivo) e deixa ver o resto. Comprar algo
 * importante é um pequeno percurso: escolher, entender a condição, ver como
 * fica o orçamento, confirmar — sem oito telas.
 */

import { useState } from 'react';
import type { Produto, Vida } from '../../../motor/tipos';
import { condicoesImovel, condicoesVeiculo, condicoesEmprestimo, disponibilidade, type Acao } from '../../../motor/acoes';
import { idade, idadePessoa, vinculosVivos } from '../../../motor/nucleo';
import { podeTentar } from '../../../motor/plausibilidade';
import { modeloMoradia, modeloVeiculo } from '../../../motor/dados/bens';
import { PRODUTOS, PALAVRA_RISCO, produto } from '../../../motor/dados/investimentos';
import { animaisParaVoce, imoveisParaVoce, investimentosParaVoce, veiculosParaVoce } from '../../../motor/sistemas/relevancia';
import { aplicacao } from '../../../motor/sistemas/investimentos';
import { rendaPropriaMensal, seguranca, orcamento } from '../../../motor/sistemas/dinheiro';
import { amigoParaDividir, custoDeEntrada } from '../../../motor/sistemas/moradia';
import { moraComFamiliaDeOrigem } from '../../../motor/sistemas/domicilio';
import { estadoDoVeiculo, custoRevisao } from '../../../motor/sistemas/veiculos';
import type { AnimalDoAbrigo, OfertaImovel, OfertaVeiculo } from '../../../motor/sistemas/mercado';
import { BotaoAcao, Escolha, Folha } from '../../comum';
import { Retrato } from '../../avatar/Retrato';
import { Icone } from './Desenhos';
import { dinheiroCheio, dinheiroCurto } from '../../leituraMaterial';

export type QualLugar = 'alugar' | 'comprar' | 'concessionaria' | 'usados' | 'motos' | 'oficina' | 'banco' | 'abrigo';

interface Props { vida: Vida; agir: (a: Acao) => boolean; qual: QualLugar; aoFechar: () => void; trocar: (l: QualLugar) => void }

const TITULO: Record<QualLugar, string> = {
  alugar: 'Imobiliária', comprar: 'Imobiliária', concessionaria: 'Concessionária', usados: 'Carros usados', motos: 'Motos e bicicletas', oficina: 'Oficina', banco: 'Banco', abrigo: 'Abrigo de animais'
};

export function Lugar({ vida, agir, qual, aoFechar, trocar }: Props) {
  // Depois de uma ação que muda a vida (comprou, alugou), a folha fecha.
  const agirEFechar = (a: Acao) => { const ok = agir(a); if (ok) aoFechar(); return ok; };
  return (
    <Folha titulo={TITULO[qual]} rotulo={TITULO[qual]} aoFechar={aoFechar} largura="larga">
      <div className="lugar-folha">
        {(qual === 'alugar' || qual === 'comprar') && (
          <>
            <Escolha rotulo="Alugar ou comprar" valor={qual} aoMudar={x => trocar(x)} opcoes={[{ id: 'alugar', rotulo: 'Alugar' }, { id: 'comprar', rotulo: 'Comprar' }]} />
            <Imobiliaria vida={vida} agir={agirEFechar} modo={qual === 'alugar' ? 'aluguel' : 'venda'} />
          </>
        )}
        {(qual === 'concessionaria' || qual === 'usados' || qual === 'motos') && <Veiculos vida={vida} agir={agirEFechar} lugar={qual} />}
        {qual === 'oficina' && <Oficina vida={vida} agir={agir} />}
        {qual === 'banco' && <Banco vida={vida} agir={agir} />}
        {qual === 'abrigo' && <Abrigo vida={vida} agir={agirEFechar} />}
      </div>
    </Folha>
  );
}

/* ------------------------------------------------------------ Imobiliária */

function Imobiliaria({ vida, agir, modo }: { vida: Vida; agir: (a: Acao) => boolean; modo: 'aluguel' | 'venda' }) {
  const { para, resto } = imoveisParaVoce(vida, modo);
  const [aberta, setAberta] = useState<string | null>(null);
  const [verTudo, setVerTudo] = useState(false);
  const escolhida = [...para.map(x => x.item), ...resto].find(o => o.id === aberta);
  if (escolhida) return <DetalheImovel vida={vida} agir={agir} o={escolhida} voltar={() => setAberta(null)} />;
  const renda = rendaPropriaMensal(vida);
  return (
    <>
      <p className="nota">{modo === 'aluguel' ? `Com a sua renda (${dinheiroCurto(renda)} por mês), um aluguel confortável fica até uns ${dinheiroCurto(renda * 0.3)}.` : 'Comprar prende dinheiro e traz manutenção; forma patrimônio. Alugar deixa mudar com facilidade. Nenhum dos dois é vitória.'}</p>
      {para.length > 0 ? (
        <>
          <h3 className="subtitulo">Para você, agora</h3>
          <ul className="ofertas">{para.map(x => <li key={x.item.id}><CartaoImovel o={x.item} motivo={x.motivo} abrir={() => setAberta(x.item.id)} vida={vida} /></li>)}</ul>
        </>
      ) : <p className="nota">{modo === 'venda' ? faltaParaComprar(vida, resto) : 'Nada que caiba no orçamento agora.'}</p>}
      <button type="button" className="botao botao--discreto" aria-expanded={verTudo} onClick={() => setVerTudo(x => !x)}>{verTudo ? 'Esconder as outras' : `Ver as outras ${resto.length} ofertas`}</button>
      {verTudo && <ul className="ofertas ofertas--resto">{resto.map(o => <li key={o.id}><CartaoImovel o={o} abrir={() => setAberta(o.id)} vida={vida} /></li>)}</ul>}
    </>
  );
}

/** Quando nada cabe: quanto a compra mais barata pede agora. */
function faltaParaComprar(vida: Vida, ofertas: OfertaImovel[]): string {
  const barata = [...ofertas].sort((a, b) => a.preco - b.preco)[0];
  if (!barata) return 'Nada à venda agora.';
  const c = condicoesImovel(vida, barata.preco, true);
  const precisa = c.entradaMinima + c.custos;
  return `Nada cabe ainda. A mais barata (${dinheiroCurto(barata.preco)}) pede uns ${dinheiroCurto(precisa)} de entrada e escritura, e uma parcela de ${dinheiroCurto(c.parcela)} por mês.`;
}

function CartaoImovel({ o, motivo, abrir, vida }: { o: OfertaImovel; motivo?: string; abrir: () => void; vida: Vida }) {
  const m = modeloMoradia(o.modeloId);
  const renda = Math.max(1, rendaPropriaMensal(vida));
  const valor = o.modo === 'aluguel' ? o.aluguel : o.preco;
  return (
    <button type="button" className="oferta" onClick={abrir}>
      <Icone nome={o.modeloId === 'kitnet' ? 'kitnet' : m.casa ? 'casa' : 'predio'} />
      <span className="oferta__texto">
        <strong>{m.nome.charAt(0).toUpperCase() + m.nome.slice(1)} {o.bairro}</strong>
        <span>{o.detalhe} · {m.quartos} {m.quartos === 1 ? 'quarto' : 'quartos'}{o.aceitaPet ? ' · aceita animais' : ''}</span>
        {motivo && <span className="oferta__motivo">{motivo}</span>}
      </span>
      <span className="oferta__preco">{dinheiroCurto(valor)}{o.modo === 'aluguel' ? <small>/mês · {Math.round(valor / renda * 100)}% da renda</small> : <small>à venda</small>}</span>
    </button>
  );
}

function DetalheImovel({ vida, agir, o, voltar }: { vida: Vida; agir: (a: Acao) => boolean; o: OfertaImovel; voltar: () => void }) {
  const m = modeloMoradia(o.modeloId);
  const naFamilia = moraComFamiliaDeOrigem(vida);
  const [financiar, setFinanciar] = useState(true);
  const [entradaPct, setEntradaPct] = useState<'min' | '30' | '50'>('min');
  const [prazo, setPrazo] = useState(30);
  const [morar, setMorar] = useState(true);
  const [dividir, setDividir] = useState(false);
  const amigo = amigoParaDividir(vida);
  if (o.modo === 'aluguel') {
    const parte = dividir ? o.aluguel / 2 : o.aluguel;
    const acao: Acao = { tipo: naFamilia ? 'sair_de_casa' : 'trocar_moradia', ofertaId: o.id, dividirCom: dividir ? amigo?.id : undefined };
    const antes = orcamento(vida);
    return (
      <div className="detalhe">
        <button type="button" className="botao botao--discreto" onClick={voltar}>← Voltar às ofertas</button>
        <h3 className="detalhe__titulo">{m.nome.charAt(0).toUpperCase() + m.nome.slice(1)} {o.bairro}</h3>
        <p className="nota">{m.descricao} {o.detalhe.charAt(0).toUpperCase() + o.detalhe.slice(1)}. {o.aceitaPet ? 'Aceita animais.' : 'Não aceita animais.'}</p>
        <dl className="objeto__numeros">
          <div><dt>Aluguel</dt><dd>{dinheiroCheio(o.aluguel)}/mês</dd></div>
          {dividir && <div><dt>Sua parte</dt><dd>{dinheiroCheio(parte)}/mês</dd></div>}
          <div><dt>Para entrar</dt><dd>{dinheiroCheio(custoDeEntrada(vida, parte))}</dd></div>
          <div><dt>Hoje sobra</dt><dd>{dinheiroCurto(antes.sobra)}/mês</dd></div>
        </dl>
        {amigo && m.quartos >= 2 && o.modeloId !== 'republica' && (
          <label className="marcar"><input type="checkbox" checked={dividir} onChange={e => setDividir(e.target.checked)} /> Dividir com {amigo.nome}</label>
        )}
        <p className="nota">{naFamilia ? 'Sair de casa muda a conta: mercado, luz, internet, tudo passa a ser seu.' : 'A caução são dois aluguéis; a mudança, um frete.'}</p>
        <BotaoAcao vida={vida} acao={acao} agir={agir} variante="principal">{naFamilia ? 'Alugar e sair de casa' : 'Alugar e mudar'}</BotaoAcao>
      </div>
    );
  }
  const minimo = condicoesImovel(vida, o.preco, true);
  const entrada = entradaPct === 'min' ? minimo.entradaMinima : Math.round(o.preco * (entradaPct === '30' ? 0.3 : 0.5));
  const c = condicoesImovel(vida, o.preco, financiar, entrada, prazo);
  const prazos = [10, 20, 30, 35].filter(x => x <= c.prazoMaximo);
  const acao: Acao = { tipo: 'comprar_imovel', ofertaId: o.id, financiar, morar, entrada, prazo };
  return (
    <div className="detalhe">
      <button type="button" className="botao botao--discreto" onClick={voltar}>← Voltar às ofertas</button>
      <h3 className="detalhe__titulo">{m.nome.charAt(0).toUpperCase() + m.nome.slice(1)} {o.bairro}</h3>
      <p className="nota">{m.descricao} {o.detalhe.charAt(0).toUpperCase() + o.detalhe.slice(1)}.{o.estado === 'reforma' ? ' Vem com obra para fazer.' : ''}</p>
      <Escolha rotulo="Forma de pagamento" valor={financiar ? 'fin' : 'vista'} aoMudar={x => setFinanciar(x === 'fin')} opcoes={[{ id: 'fin', rotulo: 'Financiar' }, { id: 'vista', rotulo: 'À vista' }]} />
      {financiar && (
        <>
          <div className="campo"><span className="campo__rotulo">Entrada</span>
            <Escolha rotulo="Entrada" valor={entradaPct} aoMudar={setEntradaPct} opcoes={[{ id: 'min', rotulo: `Mínima (${Math.round(minimo.entradaMinima / o.preco * 100)}%)` }, { id: '30', rotulo: '30%' }, { id: '50', rotulo: '50%' }]} />
          </div>
          {prazos.length > 0 && (
            <div className="campo"><span className="campo__rotulo">Prazo</span>
              <Escolha rotulo="Prazo" valor={String(prazos.includes(prazo) ? prazo : prazos[prazos.length - 1])} aoMudar={x => setPrazo(Number(x))} opcoes={prazos.map(p => ({ id: String(p), rotulo: `${p} anos` }))} />
            </div>
          )}
        </>
      )}
      <dl className="objeto__numeros">
        <div><dt>Preço</dt><dd>{dinheiroCheio(o.preco)}</dd></div>
        {financiar ? <div><dt>Entrada</dt><dd>{dinheiroCheio(c.entrada)}</dd></div> : null}
        <div><dt>Escritura e impostos</dt><dd>{dinheiroCheio(c.custos)}</dd></div>
        {financiar && <div><dt>Parcela</dt><dd>{dinheiroCheio(c.parcela)}/mês</dd></div>}
        {financiar && <div><dt>Pesa na renda</dt><dd>{Math.round(c.peso * 100)}%</dd></div>}
        {financiar && <div><dt>Total pago no fim</dt><dd>{dinheiroCurto(c.total)}</dd></div>}
      </dl>
      {financiar && <p className="nota">Um financiamento é uma obrigação presa à casa: enquanto paga, a parte que já é sua cresce. {c.social ? 'Pela renda, entra num programa habitacional, com juro menor.' : ''}</p>}
      <label className="marcar"><input type="checkbox" checked={morar} onChange={e => setMorar(e.target.checked)} /> Morar lá (sem marcar: comprar para alugar)</label>
      <BotaoAcao vida={vida} acao={acao} agir={agir} variante="principal">{financiar ? 'Financiar e comprar' : 'Comprar à vista'}</BotaoAcao>
    </div>
  );
}

/* -------------------------------------------------------------- Veículos */

function Veiculos({ vida, agir, lugar }: { vida: Vida; agir: (a: Acao) => boolean; lugar: OfertaVeiculo['lugar'] }) {
  const { para, resto } = veiculosParaVoce(vida, lugar);
  const [aberta, setAberta] = useState<string | null>(null);
  const [verTudo, setVerTudo] = useState(false);
  const escolhida = [...para.map(x => x.item), ...resto].find(o => o.id === aberta);
  if (escolhida) return <DetalheVeiculo vida={vida} agir={agir} o={escolhida} voltar={() => setAberta(null)} />;
  return (
    <>
      <p className="nota">{lugar === 'usados' ? 'Usado custa menos e dá mais oficina. Cada anúncio tem uma história.' : lugar === 'concessionaria' ? 'Zero quilômetro: garantia, cheiro de novo — e o valor cai assim que sai da loja.' : 'Moto e bicicleta: baratas de manter, expostas no trânsito.'}{!vida.trabalho.licencas.includes('cnh') && lugar !== 'motos' ? ' Sem carteira de motorista, não dá para dirigir.' : ''}</p>
      {para.length > 0 && <><h3 className="subtitulo">Para você, agora</h3><ul className="ofertas">{para.map(x => <li key={x.item.id}><CartaoVeiculo o={x.item} motivo={x.motivo} abrir={() => setAberta(x.item.id)} /></li>)}</ul></>}
      <button type="button" className="botao botao--discreto" aria-expanded={verTudo} onClick={() => setVerTudo(x => !x)}>{verTudo ? 'Esconder os outros' : `Ver os outros ${resto.length}`}</button>
      {verTudo && <ul className="ofertas ofertas--resto">{resto.map(o => <li key={o.id}><CartaoVeiculo o={o} abrir={() => setAberta(o.id)} /></li>)}</ul>}
    </>
  );
}

function CartaoVeiculo({ o, motivo, abrir }: { o: OfertaVeiculo; motivo?: string; abrir: () => void }) {
  const m = modeloVeiculo(o.modeloId);
  return (
    <button type="button" className="oferta" onClick={abrir}>
      <Icone nome={m.categoria} />
      <span className="oferta__texto">
        <strong>{m.nome.charAt(0).toUpperCase() + m.nome.slice(1)} {o.anoFabricacao}{o.usado ? '' : ' zero'}</strong>
        <span>{o.usado ? `${o.historico} · ${o.estado >= 80 ? 'bem conservado' : o.estado >= 60 ? 'marcas de uso' : 'cansado'}` : m.descricao}</span>
        {motivo && <span className="oferta__motivo">{motivo}</span>}
      </span>
      <span className="oferta__preco">{dinheiroCurto(o.preco)}</span>
    </button>
  );
}

function DetalheVeiculo({ vida, agir, o, voltar }: { vida: Vida; agir: (a: Acao) => boolean; o: OfertaVeiculo; voltar: () => void }) {
  const m = modeloVeiculo(o.modeloId);
  const [financiar, setFinanciar] = useState(false);
  const [entradaPct, setEntradaPct] = useState<'min' | '50'>('min');
  const entrada = Math.round(o.preco * (entradaPct === 'min' ? 0.2 : 0.5));
  const c = condicoesVeiculo(vida, o.preco, financiar, entrada);
  const uso = m.usoMensal;
  return (
    <div className="detalhe">
      <button type="button" className="botao botao--discreto" onClick={voltar}>← Voltar</button>
      <h3 className="detalhe__titulo">{m.nome.charAt(0).toUpperCase() + m.nome.slice(1)} {o.anoFabricacao}</h3>
      <p className="nota">{m.descricao}{o.usado ? ` Anúncio: ${o.historico}.` : ''}</p>
      {o.preco >= 8000 && <Escolha rotulo="Forma de pagamento" valor={financiar ? 'fin' : 'vista'} aoMudar={x => setFinanciar(x === 'fin')} opcoes={[{ id: 'vista', rotulo: 'À vista' }, { id: 'fin', rotulo: 'Financiar' }]} />}
      {financiar && <div className="campo"><span className="campo__rotulo">Entrada</span><Escolha rotulo="Entrada" valor={entradaPct} aoMudar={setEntradaPct} opcoes={[{ id: 'min', rotulo: '20%' }, { id: '50', rotulo: '50%' }]} /></div>}
      <dl className="objeto__numeros">
        <div><dt>Preço</dt><dd>{dinheiroCheio(o.preco)}</dd></div>
        {financiar && <div><dt>Parcela</dt><dd>{dinheiroCheio(c.parcela)} × {c.meses}</dd></div>}
        {financiar && <div><dt>Total pago</dt><dd>{dinheiroCurto(c.total)}</dd></div>}
        <div><dt>Para rodar</dt><dd>uns {dinheiroCurto(uso)}/mês{m.taxaAnual ? ' + IPVA e seguro' : ''}</dd></div>
      </dl>
      <BotaoAcao vida={vida} acao={{ tipo: 'comprar_veiculo', ofertaId: o.id, financiar, entrada }} agir={agir} variante="principal">{financiar ? 'Financiar' : 'Comprar'}</BotaoAcao>
    </div>
  );
}

/* --------------------------------------------------------------- Oficina */

function Oficina({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const lista = vida.financas.bens.filter(b => b.tipo === 'veiculo');
  if (!lista.length) return <p className="nota">Nenhum veículo para cuidar.</p>;
  return (
    <ul className="ofertas">
      {lista.map(b => b.tipo === 'veiculo' && (
        <li key={b.id} className="oficina">
          <div className="oferta oferta--estatica">
            <Icone nome={modeloVeiculo(b.modeloId).categoria} />
            <span className="oferta__texto"><strong>{b.nome.charAt(0).toUpperCase() + b.nome.slice(1)} {b.anoFabricacao ?? ''}</strong><span>{estadoDoVeiculo(b)}{b.problema ? ` — ${dinheiroCheio(b.problema.custo)}` : ''}</span></span>
          </div>
          <div className="grupo-acoes grupo-acoes--linha">
            <BotaoAcao vida={vida} acao={{ tipo: 'veiculo', bemId: b.id, oque: 'consertar' }} agir={agir} ocultarBloqueado>Consertar</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'veiculo', bemId: b.id, oque: 'adiar' }} agir={agir} variante="discreto" ocultarBloqueado>Adiar</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'veiculo', bemId: b.id, oque: 'revisao' }} agir={agir} variante="discreto" ocultarBloqueado>{`Revisão (${dinheiroCurto(custoRevisao(vida, b))})`}</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'vender_bem', bemId: b.id }} agir={agir} variante="discreto">Vender</BotaoAcao>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ----------------------------------------------------------------- Banco */

function Banco({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [aba, setAba] = useState<'guardar' | 'emprestimo'>('guardar');
  return (
    <>
      <Escolha rotulo="No banco" valor={aba} aoMudar={setAba} opcoes={[{ id: 'guardar', rotulo: 'Guardar e investir' }, { id: 'emprestimo', rotulo: 'Empréstimo' }]} />
      {aba === 'guardar' ? <Guardar vida={vida} agir={agir} /> : <Emprestimo vida={vida} agir={agir} />}
    </>
  );
}

function Guardar({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [escolhido, setEscolhido] = useState<Produto | null>(null);
  const [valor, setValor] = useState(0);
  const [verTodos, setVerTodos] = useState(false);
  const sug = investimentosParaVoce(vida);
  const seg = seguranca(vida);
  const conta = Math.max(0, Math.round(vida.financas.conta));
  const lista = verTodos ? PRODUTOS : PRODUTOS.filter(p => sug.some(s => s.item.id === p.id) || aplicacao(vida, p.id));
  const p = escolhido ? produto(escolhido) : undefined;
  const ap = escolhido ? aplicacao(vida, escolhido) : undefined;
  const sugestoes = [500, 1000, 5000, 20000].filter(x => x <= conta);
  return (
    <>
      <p className="nota">Na conta: {dinheiroCheio(conta)}. {seg.texto}</p>
      <ul className="produtos">
        {lista.map(x => {
          const s = sug.find(y => y.item.id === x.id);
          const a = aplicacao(vida, x.id);
          return (
            <li key={x.id}>
              <button type="button" className={`produto${escolhido === x.id ? ' produto--ativo' : ''}`} aria-pressed={escolhido === x.id} onClick={() => { setEscolhido(x.id); setValor(0); }}>
                <span className="produto__nome">{x.nome}</span>
                <span className="produto__risco"><span className="escala escala--pequena" aria-hidden>{[1, 2, 3, 4, 5].map(k => <span key={k} className={`escala__marca${k <= x.risco ? ' escala__marca--cheia' : ''}`} />)}</span>{PALAVRA_RISCO[x.risco]}</span>
                <span className="produto__oque">{x.oque}</span>
                {s && <span className="oferta__motivo">{s.motivo}</span>}
                {a && <span className="produto__tem">Você tem {dinheiroCurto(a.valor)} aqui.</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {!verTodos && <button type="button" className="botao botao--discreto" onClick={() => setVerTodos(true)}>Ver todos os jeitos de guardar</button>}
      {p && (
        <div className="detalhe">
          <h3 className="detalhe__titulo">{p.nome}</h3>
          <ul className="fatos">
            <li><strong>Num ano ruim:</strong> {p.riscoTexto}</li>
            <li><strong>Para tirar:</strong> {p.liquidez}</li>
            <li><strong>Faz sentido para:</strong> {p.horizonte}</li>
            <li><strong>Renda:</strong> {p.renda ?? 'Não paga nada na conta: o rendimento fica dentro, e só vira dinheiro quando você tira.'}</li>
          </ul>
          <label className="campo">
            <span className="campo__rotulo">Quanto</span>
            <input type="number" inputMode="numeric" min={0} step={100} value={valor || ''} placeholder="valor em reais" onChange={e => setValor(Math.max(0, Math.round(Number(e.target.value))))} />
          </label>
          {sugestoes.length > 0 && <div className="fichas-valor">{sugestoes.map(x => <button key={x} type="button" className="ficha-valor" onClick={() => setValor(x)}>{dinheiroCurto(x)}</button>)}<button type="button" className="ficha-valor" onClick={() => setValor(conta)}>Tudo ({dinheiroCurto(conta)})</button></div>}
          <div className="grupo-acoes grupo-acoes--linha">
            <BotaoAcao vida={vida} acao={{ tipo: 'investir', destino: p.id, valor }} agir={agir} aoAgir={() => setValor(0)}>Aplicar</BotaoAcao>
            {ap && <BotaoAcao vida={vida} acao={{ tipo: 'resgatar', origem: p.id, valor: Math.min(valor || ap.valor, ap.valor) }} agir={agir} variante="discreto" aoAgir={() => setValor(0)}>{valor ? `Tirar ${dinheiroCurto(Math.min(valor, ap.valor))}` : `Tirar tudo (${dinheiroCurto(ap.valor)})`}</BotaoAcao>}
          </div>
        </div>
      )}
    </>
  );
}

function Emprestimo({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [valor, setValor] = useState(5000);
  const [meses, setMeses] = useState(24);
  const c = condicoesEmprestimo(vida, valor, meses);
  return (
    <div className="detalhe">
      <p className="nota">{c.consignado ? 'Com salário garantido ou aposentadoria, o banco oferece consignado: a parcela sai direto do pagamento, com juro menor.' : 'Empréstimo pessoal: juro alto. Ajuda a atravessar um aperto — e pesa todo mês depois.'} Pela sua renda, até {dinheiroCurto(c.maximo)}.</p>
      <label className="campo"><span className="campo__rotulo">Quanto</span><input type="number" inputMode="numeric" min={500} step={500} value={valor || ''} onChange={e => setValor(Math.max(0, Math.round(Number(e.target.value))))} /></label>
      <div className="campo"><span className="campo__rotulo">Em quantas vezes</span><Escolha rotulo="Prazo" valor={String(meses)} aoMudar={x => setMeses(Number(x))} opcoes={[12, 24, 48, ...(c.consignado ? [72] : [])].map(x => ({ id: String(x), rotulo: `${x}×` }))} /></div>
      <dl className="objeto__numeros">
        <div><dt>Parcela</dt><dd>{dinheiroCheio(c.parcela)}</dd></div>
        <div><dt>Total pago</dt><dd>{dinheiroCheio(c.total)}</dd></div>
        <div><dt>Juros no total</dt><dd>{dinheiroCheio(c.total - valor)}</dd></div>
      </dl>
      <BotaoAcao vida={vida} acao={{ tipo: 'emprestimo', valor, meses }} agir={agir}>Pegar o empréstimo</BotaoAcao>
    </div>
  );
}

/* ---------------------------------------------------------------- Abrigo */

function Abrigo({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const { para, resto } = animaisParaVoce(vida);
  const [verTodos, setVerTodos] = useState(false);
  const lista = verTodos ? [...para.map(x => x.item), ...resto] : para.map(x => x.item);
  const motivo = (a: AnimalDoAbrigo) => para.find(x => x.item.id === a.id)?.motivo;
  const familia = vinculosVivos(vida).filter(x => x.p.especie && !x.vin.convivio.includes('casa') && x.p.pet?.tutor !== 'eu' && x.p.municipioId === vida.moradia.municipioId && x.vin.proximidade >= 30 && idadePessoa(vida, x.p) >= 0);
  return (
    <>
      <p className="nota">Um bicho não é um objeto: mora junto, pede tempo, ração, vacina, veterinário — e vive bem menos que a gente. {idade(vida) < 18 ? '' : 'Adotar é de graça; cuidar, não.'}</p>
      {familia.length > 0 && !moraComFamiliaDeOrigem(vida) && (
        <div className="aviso-suave">
          {familia.map(x => <BotaoAcao key={x.p.id} vida={vida} acao={{ tipo: 'levar_pet', petId: x.p.id }} agir={agir} variante="discreto">{`Trazer ${x.p.nome}, que ficou na casa da família`}</BotaoAcao>)}
        </div>
      )}
      <ul className="animais">
        {lista.map(a => {
          const d = disponibilidade(vida, { tipo: 'adotar_pet', animalId: a.id });
          return (
            <li key={a.id} className="animal">
              <Retrato visual={undefined} genero={a.genero} idade={a.idade} semente={a.id} tamanho={64} especie={a.especie} rotulo={a.nome} />
              <div className="animal__texto">
                <strong>{a.nome}</strong>
                <span>{a.especie === 'gato' ? (a.genero === 'feminino' ? 'Gata' : 'Gato') : (a.genero === 'feminino' ? 'Cachorra' : 'Cachorro')}{a.especie === 'cachorro' ? ` de porte ${a.porte === 'medio' ? 'médio' : a.porte}` : ''} · {a.idade === 0 ? 'filhote' : `${a.idade} ${a.idade === 1 ? 'ano' : 'anos'}`}</span>
                <span className="animal__jeito">{a.jeito.charAt(0).toUpperCase() + a.jeito.slice(1)}. {a.historia.charAt(0).toUpperCase() + a.historia.slice(1)}.</span>
                {motivo(a) && podeTentar(d) && <span className="oferta__motivo">{motivo(a)}</span>}
              </div>
              <BotaoAcao vida={vida} acao={{ tipo: 'adotar_pet', animalId: a.id }} agir={agir}>Adotar</BotaoAcao>
            </li>
          );
        })}
      </ul>
      {!verTodos && resto.length > 0 && <button type="button" className="botao botao--discreto" onClick={() => setVerTodos(true)}>Ver os outros {resto.length}</button>}
    </>
  );
}
