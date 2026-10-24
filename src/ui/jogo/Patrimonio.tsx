/**
 * REWORK 12 — VIDA → PATRIMÔNIO: o painel do que é seu, em partes.
 *
 *   Resumo     o que é disponível, investido, preso (imóveis, veículos, coleção, empresas), o que se deve, o líquido —
 *              e a diferença entre TER e PODER PAGAR AGORA; o que o patrimônio rende e custa por mês; a evolução.
 *   Imóveis    cada imóvel com o que vale, o que rende, quem administra, o que custa.
 *   Garagem    os veículos lado a lado (onde estão, quanto valem, quanto custam), o principal, os guardados longe.
 *   Coleção    as peças (raridade, procedência, o valor estimado), vender rápido ou em leilão, ceder ao museu.
 *   Empresas   as empresas suas (os números do último ano, quem toca, as decisões), abrir uma, comprar uma parte.
 *   Objetos    as coisas da vida (os usos).
 *
 * As partes ficam todas no documento (escondidas por classe, como as abas da ficha): trocar de parte não refaz a
 * tela. Nada aqui calcula regra: os números e os bloqueios são os do motor.
 */

import { useState, type ReactNode } from 'react';
import type { Acao } from '../../motor/acoes';
import type { Colecionavel, Empresa, TipoEmpresa, Veiculo, Vida } from '../../motor/tipos';
import { idade } from '../../motor/nucleo';
import { modeloVeiculo } from '../../motor/dados/bens';
import { economiaLocal, municipio } from '../../motor/dados/lugares';
import { custosDeVeiculo, guardadoLonge, nomeComCor, ondeEsta, custoDeTrazer } from '../../motor/sistemas/veiculos';
import { aluguelDeMercado } from '../../motor/sistemas/imoveis';
import { colecao, estimativaDeVenda, lojaDeColecaoNaCidade, ofertasDeColecao, PROCEDENCIA_EM_PALAVRAS, valorDaColecao, custoDaColecao } from '../../motor/sistemas/colecao';
import { LOJAS_DE_COLECAO, NOME_CATEGORIA_COLECAO, NOME_RARIDADE, type LojaDeColecao } from '../../motor/dados/colecionaveis';
import { custoDaDecisao, empresasAtivas, leituraDoGestor, ofertasDeParticipacao, planoDeAbertura, quemToca, valorDaParte, valorDeVendaDaParte, type DecisaoEmpresa } from '../../motor/sistemas/empresas';
import { NOME_PRECO_EMPRESA, TIPOS_DE_EMPRESA, tipoDeEmpresa } from '../../motor/dados/empresas';
import { lojaNaCidade } from '../../motor/sistemas/mercado';
import { BotaoAcao, Secao, Subnav, type ItemDeSubnav } from '../comum';
import { dinheiroCheio, dinheiroCurto } from '../leituraMaterial';
import { evolucaoPatrimonial, painelPatrimonial } from '../leituraPatrimonio';
import { BensDoTipo, OQueTem } from './Casa';
import { Pertences } from './Pertences';
import { Evolucao } from './material/Desenhos';
import type { QualLugar } from './material/Lugares';
import '../patrimonio.css';

export type PartePatrimonio = 'resumo' | 'imoveis' | 'garagem' | 'colecao' | 'empresas' | 'objetos';

interface Props { vida: Vida; agir: (a: Acao) => boolean; abrir: (l: QualLugar) => void }

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function Patrimonio({ vida, agir, abrir }: Props) {
  const [parte, setParte] = useState<PartePatrimonio>('resumo');
  const i = idade(vida);
  if (i < 12) return <Pertences vida={vida} agir={agir} abrir={abrir} semVeiculos={false} />;
  const f = vida.financas;
  const itens: ItemDeSubnav<PartePatrimonio>[] = [
    { id: 'resumo', rotulo: 'Resumo', oque: 'O que tem, o que deve, o que dá para usar agora' },
    { id: 'imoveis', rotulo: 'Imóveis', conta: f.bens.filter(b => b.tipo === 'imovel').length },
    { id: 'garagem', rotulo: 'Garagem', conta: f.bens.filter(b => b.tipo === 'veiculo').length },
    { id: 'colecao', rotulo: 'Coleção', conta: colecao(vida).length },
    { id: 'empresas', rotulo: 'Empresas', conta: empresasAtivas(vida).length },
    { id: 'objetos', rotulo: 'Objetos', conta: (f.coisas ?? []).length }
  ];
  const painel = (id: PartePatrimonio, filho: ReactNode) => (
    <div key={id} role="tabpanel" id={parte === id ? 'patrimonio-painel' : undefined} aria-labelledby={`patrimonio-aba-${id}`} className={`pat-parte${parte === id ? '' : ' pat-parte--oculta'}`}>{filho}</div>
  );
  return (
    <div className="patrimonio pat">
      <Subnav rotulo="Partes do patrimônio" itens={itens} atual={parte} aoMudar={setParte} prefixo="patrimonio" classe="pat-subnav" />
      {painel('resumo', <><PainelDoPatrimonio vida={vida} /><OQueTem vida={vida} agir={agir} abrir={abrir} semBens /></>)}
      {painel('imoveis', <Imoveis vida={vida} agir={agir} abrir={abrir} />)}
      {painel('garagem', <Garagem vida={vida} agir={agir} abrir={abrir} />)}
      {painel('colecao', <Colecao vida={vida} agir={agir} abrir={abrir} />)}
      {painel('empresas', <Empresas vida={vida} agir={agir} />)}
      {painel('objetos', <Pertences vida={vida} agir={agir} abrir={abrir} semVeiculos />)}
    </div>
  );
}

/* ------------------------------------------------------------------ Resumo */

function PainelDoPatrimonio({ vida }: { vida: Vida }) {
  const p = painelPatrimonial(vida);
  const evo = evolucaoPatrimonial(vida);
  const linhas: [string, number, string][] = [
    ['Disponível na conta', p.disponivel, 'conta'], ['Investido', p.investido, 'aplicacoes'], ['Imóveis', p.imoveis, 'imoveis'], ['Veículos', p.veiculos, 'veiculos'],
    ['Coleção', p.colecao, 'colecao'], ['Empresas (a sua parte)', p.empresas, 'empresas'], ['Caixa do negócio', p.negocio, 'negocio']
  ];
  const receita = p.receitas.reduce((s, x) => s + x.valor, 0);
  const despesa = p.despesas.reduce((s, x) => s + x.valor, 0);
  return (
    <Secao titulo="O patrimônio, por partes">
      <dl className="pat-numeros">
        {linhas.filter(x => x[1] > 0).map(([r, x, id]) => <div key={id} className={`pat-numeros__item pat-numeros__item--${id}`}><dt>{r}</dt><dd>{dinheiroCurto(x)}</dd></div>)}
        <div className="pat-numeros__item pat-numeros__item--deve"><dt>Dívidas</dt><dd>{p.dividas > 0 ? `− ${dinheiroCurto(p.dividas)}` : 'nenhuma'}</dd></div>
        <div className="pat-numeros__item pat-numeros__item--liquido"><dt>Patrimônio líquido</dt><dd>{dinheiroCheio(p.liquido)}</dd></div>
      </dl>
      <div className="pat-liquidez">
        <p className="rotulo-pequeno">Ter não é poder pagar agora</p>
        <p><strong>{dinheiroCurto(p.liquidez)}</strong> dá para usar em semanas (conta, reserva, renda fixa). {p.frase}</p>
      </div>
      {(p.receitas.length > 0 || p.despesas.length > 0) && (
        <div className="pat-recorrente">
          <div>
            <p className="rotulo-pequeno">O patrimônio põe na conta · {dinheiroCurto(receita)}/mês</p>
            {p.receitas.length ? <ul>{p.receitas.map(x => <li key={x.rotulo}><span>{x.rotulo}</span><strong>{dinheiroCurto(x.valor)}</strong></li>)}</ul> : <p className="nota">Nada rende em dinheiro todo mês.</p>}
          </div>
          <div>
            <p className="rotulo-pequeno">O patrimônio custa · {dinheiroCurto(despesa)}/mês</p>
            {p.despesas.length ? <ul>{p.despesas.map((x, k) => <li key={`${x.rotulo}-${k}`}><span>{x.rotulo}</span><strong>{dinheiroCurto(x.valor)}</strong></li>)}</ul> : <p className="nota">Nada que custe por mês.</p>}
          </div>
        </div>
      )}
      {evo.length >= 3 && (
        <div className="pat-evolucao">
          <p className="rotulo-pequeno">Patrimônio líquido, ano a ano (desde {evo[0].ano})</p>
          <Evolucao valores={evo.map(x => x.liquido)} rotulo={`Patrimônio líquido de ${evo[0].ano} a ${evo[evo.length - 1].ano}: de ${dinheiroCurto(evo[0].liquido)} para ${dinheiroCurto(evo[evo.length - 1].liquido)}.`} />
          <details className="detalhes"><summary>Os números de cada ano</summary>
            <table className="pat-tabela"><thead><tr><th scope="col">Ano</th><th scope="col">Líquido</th></tr></thead>
              <tbody>{evo.slice(-12).reverse().map(x => <tr key={x.ano}><th scope="row">{x.ano}</th><td>{dinheiroCurto(x.liquido)}</td></tr>)}</tbody></table>
          </details>
        </div>
      )}
    </Secao>
  );
}

/* ------------------------------------------------------------------ Imóveis */

function Imoveis({ vida, agir, abrir }: Props) {
  const imoveis = vida.financas.bens.filter(b => b.tipo === 'imovel');
  return (
    <Secao titulo={imoveis.length === 1 ? 'Seu imóvel' : 'Seus imóveis'} extra={idade(vida) >= 18 ? <button type="button" className="botao botao--secundario" onClick={() => abrir('comprar')}>Ver imóveis à venda</button> : undefined}>
      {!imoveis.length && <p className="nota">Nenhum imóvel no seu nome. Comprar prende dinheiro e traz manutenção; alugado, rende — sem garantia de inquilino.</p>}
      {imoveis.length > 0 && (
        <ul className="pat-contas-imoveis">
          {imoveis.map(b => b.tipo === 'imovel' && (
            <li key={b.id}>
              <strong>{cap(b.nome)}{b.bairro ? ` ${b.bairro}` : ''}</strong>
              <span>{b.id === vida.moradia.imovelId ? 'Onde você mora.' : b.alugadoPor ? `${b.calote ? 'Inquilino sem pagar' : `Alugado: ${dinheiroCurto(b.alugadoPor)}/mês`} · ${(b.administracao ?? 'imobiliaria') === 'imobiliaria' ? 'com imobiliária' : 'você administra'} · rende ${(b.alugadoPor * 12 / Math.max(1, b.valor) * 100).toFixed(1).replace('.', ',')}% ao ano (bruto)` : `Vazio: alugado, renderia uns ${dinheiroCurto(Math.round(aluguelDeMercado(vida, b) / 10) * 10)}/mês.`}</span>
              {b.id !== vida.moradia.imovelId && <BotaoAcao vida={vida} acao={{ tipo: 'imovel', bemId: b.id, oque: 'administrar' }} agir={agir} variante="discreto" ocultarBloqueado>{(b.administracao ?? 'imobiliaria') === 'imobiliaria' ? 'Administrar sem imobiliária' : 'Passar para uma imobiliária'}</BotaoAcao>}
            </li>
          ))}
        </ul>
      )}
      <BensDoTipo vida={vida} agir={agir} tipo="imovel" />
    </Secao>
  );
}

/* ------------------------------------------------------------------ Garagem */

function Garagem({ vida, agir, abrir }: Props) {
  const lista = vida.financas.bens.filter((b): b is Veiculo => b.tipo === 'veiculo');
  const c = economiaLocal(vida.moradia.municipioId).custo;
  const lojas = (['concessionaria', 'usados', 'motos', 'colecionador', 'nautica', 'aeroclube'] as const).filter(l => lojaNaCidade(vida.moradia.municipioId, l));
  const nomeLoja = { concessionaria: 'Concessionária', usados: 'Usados', motos: 'Motos e bicicletas', colecionador: 'Garagem de colecionador', nautica: 'Náutica', aeroclube: 'Aeroclube' } as const;
  return (
    <Secao titulo="Garagem">
      {!lista.length && <p className="nota">Nenhum veículo. Carro dá mobilidade — e imposto, seguro, combustível e oficina.</p>}
      {lista.length > 0 && (
        <div className="pat-rolagem" data-rola-x>
          <table className="pat-tabela pat-tabela--garagem">
            <caption className="sr-only">Os seus veículos, lado a lado</caption>
            <thead><tr><th scope="col">Veículo</th><th scope="col">Onde está</th><th scope="col">Vale</th><th scope="col">Custa/mês</th><th scope="col">Estado</th></tr></thead>
            <tbody>
              {lista.map(b => {
                const custo = custosDeVeiculo(vida, b, c, vida.financas.veiculoPrincipal === b.id ? 1 : 0.7).reduce((s, x) => s + x.valor, 0);
                return (
                  <tr key={b.id}>
                    <th scope="row">{cap(nomeComCor(b))}{b.anoFabricacao ? ` ${b.anoFabricacao}` : ''}{vida.financas.veiculoPrincipal === b.id ? <span className="pat-selo">principal</span> : null}{modeloVeiculo(b.modeloId).segmento === 'classico' ? <span className="pat-selo">clássico</span> : null}</th>
                    <td>{guardadoLonge(vida, b) ? `guardado em ${municipio(ondeEsta(vida, b)).nome}` : 'com você'}</td>
                    <td>{dinheiroCurto(b.valor)}</td>
                    <td>{dinheiroCurto(custo)}</td>
                    <td>{b.estado >= 80 ? 'inteiro' : b.estado >= 60 ? 'bom' : b.estado >= 40 ? 'gasto' : 'cansado'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {lista.filter(b => guardadoLonge(vida, b)).map(b => {
        const t = custoDeTrazer(vida, b);
        return (
          <div key={b.id} className="pat-guardado">
            <p><strong>{cap(nomeComCor(b))}</strong> está guardad{b.modeloId.startsWith('moto') ? 'a' : 'o'} em {municipio(ondeEsta(vida, b)).nome}: não leva ninguém a lugar nenhum, segue pagando a guarda e perdendo valor devagar.</p>
            {t.bloqueio ? <p className="nota">{t.bloqueio} Dá para vender de longe.</p> : <p className="nota">Trazer custa uns {dinheiroCurto(t.custo)}{t.internacional ? ' (frete, documentos e o imposto de importação daqui)' : ''}.</p>}
            <div className="grupo-acoes grupo-acoes--linha">
              <BotaoAcao vida={vida} acao={{ tipo: 'veiculo', bemId: b.id, oque: 'trazer' }} agir={agir} variante="secundario" ocultarBloqueado>Trazer para cá</BotaoAcao>
            </div>
          </div>
        );
      })}
      <BensDoTipo vida={vida} agir={agir} tipo="veiculo" />
      {idade(vida) >= 16 && lojas.length > 0 && (
        <div className="pat-lojas" aria-label="Lojas de veículos da cidade">
          {lojas.map(l => <button key={l} type="button" className="botao botao--discreto" onClick={() => abrir(l)}>{nomeLoja[l]}</button>)}
        </div>
      )}
    </Secao>
  );
}

/* ------------------------------------------------------------------ Coleção */

const NOME_DA_LOJA = (l: LojaDeColecao) => LOJAS_DE_COLECAO[l].nome;

function Colecao({ vida, agir, abrir }: Props) {
  const lista = colecao(vida);
  const total = valorDaColecao(vida);
  const pago = lista.reduce((s, c) => s + c.precoPago, 0);
  const seguro = custoDaColecao(vida);
  const lojas = (Object.keys(LOJAS_DE_COLECAO) as LojaDeColecao[]).filter(l => lojaDeColecaoNaCidade(vida.moradia.municipioId, l));
  const museus = empresasAtivas(vida).filter(e => e.acervo && e.papel !== 'investidor');
  return (
    <Secao titulo="Coleção">
      {lista.length ? (
        <p className="nota">{lista.length} {lista.length === 1 ? 'peça' : 'peças'}, uns <strong>{dinheiroCurto(total)}</strong> no mercado hoje (pagou {dinheiroCurto(pago)}). O valor é estimado: só a venda diz o número de verdade.{seguro ? ` Seguro e guarda: ${dinheiroCurto(seguro)}/mês.` : ''}</p>
      ) : <p className="nota">Nenhuma peça. Relógio, joia, arte, antiguidade, memorabilia: a margem da loja fica na compra, e a revenda depende de quem quiser.</p>}
      {lista.length > 0 && <ul className="pat-pecas">{lista.map(c => <Peca key={c.id} vida={vida} agir={agir} c={c} museus={museus} />)}</ul>}
      {idade(vida) >= 18 && (
        <div className="pat-lojas" aria-label="Onde se compram peças">
          {lojas.map(l => <button key={l} type="button" className="botao botao--discreto" onClick={() => abrir(l)}>{NOME_DA_LOJA(l)}</button>)}
        </div>
      )}
    </Secao>
  );
}

function Peca({ vida, agir, c, museus }: { vida: Vida; agir: (a: Acao) => boolean; c: Colecionavel; museus: Empresa[] }) {
  const [vender, setVender] = useState(false);
  const ganho = c.valor - c.precoPago;
  return (
    <li className={`pat-peca pat-peca--${c.categoria}`}>
      <div className="pat-peca__cabeca">
        <strong>{cap(c.nome)}</strong>
        <span className="pat-peca__meta">{NOME_CATEGORIA_COLECAO[c.categoria].um} · {NOME_RARIDADE[c.raridade]} · {PROCEDENCIA_EM_PALAVRAS[c.procedencia]}{c.certificado ? '' : ' (sem certificado)'}</span>
      </div>
      <dl className="objeto__numeros">
        <div><dt>Vale (estimado)</dt><dd>{dinheiroCurto(c.valor)}</dd></div>
        {c.precoPago > 0 && <div><dt>{ganho >= 0 ? 'Acima do pago' : 'Abaixo do pago'}</dt><dd className={ganho >= 0 ? 'ganho' : 'perda'}>{dinheiroCurto(Math.abs(ganho))}</dd></div>}
        <div><dt>Estado</dt><dd>{c.estado >= 85 ? 'impecável' : c.estado >= 65 ? 'bom' : c.estado >= 45 ? 'marcado pelo tempo' : 'precisando de restauro'}</dd></div>
      </dl>
      {c.afeto && <p className="nota">Importa por outra razão: {c.afeto}.</p>}
      {c.emprestadaA && <p className="nota">Em exposição no museu (continua sua).</p>}
      <div className="grupo-acoes grupo-acoes--linha">
        {museus.map(e => <BotaoAcao key={e.id} vida={vida} acao={{ tipo: 'colecao_ceder', pecaId: c.id, empresaId: e.id }} agir={agir} variante="discreto" ocultarBloqueado>Ceder ao {e.nome}</BotaoAcao>)}
        {!vender ? <button type="button" className="link link--discreto" onClick={() => setVender(true)}>Vender…</button> : (
          <div className="pat-confirmar" role="group" aria-label="Vender a peça">
            <p className="nota">Vender não se desfaz. {c.afeto ? 'E esta peça não é só dinheiro.' : ''}</p>
            <BotaoAcao vida={vida} acao={{ tipo: 'colecao_vender', pecaId: c.id, modo: 'rapido' }} agir={agir} variante="secundario">Para um comerciante (uns {dinheiroCurto(estimativaDeVenda(c, 'rapido'))}, na hora)</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'colecao_vender', pecaId: c.id, modo: 'leilao' }} agir={agir} variante="secundario" ocultarBloqueado>Em leilão (uns {dinheiroCurto(estimativaDeVenda(c, 'leilao'))}, se aparecer comprador; a comissão já sai)</BotaoAcao>
            <button type="button" className="botao botao--discreto" onClick={() => setVender(false)}>Deixar como está</button>
          </div>
        )}
      </div>
    </li>
  );
}

/** A loja de peças da cidade (aberta em Compras ou na Coleção): o que vende, o preço, o que vale depois de sair da loja. */
export function LojaDeColecaoDaCidade({ vida, agir, loja }: { vida: Vida; agir: (a: Acao) => boolean; loja: LojaDeColecao }) {
  const ofertas = ofertasDeColecao(vida, loja);
  const l = LOJAS_DE_COLECAO[loja];
  return (
    <div className="loja-estilo pat-loja">
      <p className="nota">{l.frase}</p>
      {!ofertas.length && <p className="nota">{lojaDeColecaoNaCidade(vida.moradia.municipioId, loja) ? 'Nada à venda este ano.' : 'Não há uma destas na cidade: só nas metrópoles e capitais.'}</p>}
      <ul className="ofertas">
        {ofertas.map(o => (
          <li key={o.id} className="oferta oferta--estilo">
            <span className="oferta__texto">
              <strong>{cap(o.nome)}</strong>
              <span>{NOME_CATEGORIA_COLECAO[o.categoria].um} · {NOME_RARIDADE[o.raridade]}{o.certificado ? ' · com certificado' : ' · sem procedência'}</span>
              <span className="nota">Depois de comprada, no mercado de revenda, deve valer uns {dinheiroCurto(o.valorEstimado)} — não é promessa: o valor anda com o mercado.</span>
            </span>
            <span className="oferta__preco">{dinheiroCurto(o.preco)}{loja === 'leilao' ? <small>com a comissão</small> : null}</span>
            <span className="oferta__comprar"><BotaoAcao vida={vida} acao={{ tipo: 'colecao_comprar', ofertaId: o.id }} agir={agir} variante="secundario">{loja === 'leilao' ? 'Dar o lance' : 'Comprar'}</BotaoAcao></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ Empresas */

function Empresas({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const lista = empresasAtivas(vida);
  const [abrindo, setAbrindo] = useState(false);
  const ofertas = ofertasDeParticipacao(vida);
  return (
    <Secao titulo="Empresas">
      <p className="nota">Empresa sua não é salário: o caixa é dela; o lucro só vira seu quando é distribuído. Dá para ter uma sem largar a profissão — com alguém contratado tocando, ou tocando você mesm{vida.eu.genero === 'feminino' ? 'a' : 'o'} (algumas noites e os sábados).</p>
      {lista.map(e => <CartaoEmpresa key={e.id} vida={vida} agir={agir} e={e} />)}
      {idade(vida) >= 18 && (
        <div className="pat-abrir">
          <button type="button" className="botao botao--secundario" aria-expanded={abrindo} onClick={() => setAbrindo(x => !x)}>{abrindo ? 'Fechar' : 'Abrir uma empresa'}</button>
          {abrindo && <AbrirEmpresa vida={vida} agir={agir} />}
        </div>
      )}
      {ofertas.length > 0 && (
        <div className="pat-participacoes">
          <h3 className="subtitulo">Participações à venda na cidade</h3>
          <p className="nota">Uma parte de uma empresa que outros tocam: você recebe o que eles distribuírem — e não manda em nada. Os números são os dos últimos três anos; os próximos, ninguém sabe.</p>
          <ul className="ofertas">
            {ofertas.map(o => (
              <li key={o.id} className="oferta oferta--estilo">
                <span className="oferta__texto">
                  <strong>{Math.round(o.parte * 100)}% de {o.nome} ({tipoDeEmpresa(o.tipo).rotulo.toLowerCase()})</strong>
                  <span>Resultado dos últimos anos: {o.historico.map(x => dinheiroCurto(x)).join(', ')}. A empresa toda vale uns {dinheiroCurto(o.avaliacao)}.</span>
                </span>
                <span className="oferta__preco">{dinheiroCurto(o.preco)}</span>
                <span className="oferta__comprar"><BotaoAcao vida={vida} acao={{ tipo: 'participacao', ofertaId: o.id }} agir={agir} variante="secundario">Comprar a parte</BotaoAcao></span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Secao>
  );
}

const ESTADO_EMPRESA: Record<Empresa['estado'], string> = { abrindo: 'em obra', operando: 'funcionando', em_crise: 'no vermelho', interditada: 'interditada', encerrada: 'encerrada' };

function CartaoEmpresa({ vida, agir, e }: { vida: Vida; agir: (a: Acao) => boolean; e: Empresa }) {
  const t = tipoDeEmpresa(e.tipo);
  const u = e.ultimo;
  const [saida, setSaida] = useState(false);
  const decidir = (d: DecisaoEmpresa, rotulo: string, variante: 'secundario' | 'discreto' = 'discreto') => <BotaoAcao key={d} vida={vida} acao={{ tipo: 'empresa', empresaId: e.id, decisao: d }} agir={agir} variante={variante} ocultarBloqueado>{rotulo}</BotaoAcao>;
  const custo = (d: DecisaoEmpresa) => dinheiroCurto(custoDaDecisao(vida, e, d));
  return (
    <article className={`pat-empresa pat-empresa--${e.estado}`}>
      <header className="pat-empresa__cabeca">
        <div>
          <h3>{e.nome}</h3>
          <p className="nota">{t.rotulo} em {municipio(e.municipioId).nome} · {e.papel === 'dono' ? 'sua' : e.papel === 'socio' ? `${Math.round(e.parte * 100)}% seus, com ${e.socio}` : `${Math.round(e.parte * 100)}% seus (investidor${vida.eu.genero === 'feminino' ? 'a' : ''})`} · {e.unidades > 1 ? `${e.unidades} unidades · ` : ''}{ESTADO_EMPRESA[e.estado]}</p>
        </div>
        <span className={`pat-empresa__estado pat-empresa__estado--${e.estado}`}>{ESTADO_EMPRESA[e.estado]}</span>
      </header>
      <dl className="objeto__numeros">
        <div><dt>A sua parte vale</dt><dd>{dinheiroCurto(valorDaParte(e))}</dd></div>
        <div><dt>Você pôs</dt><dd>{dinheiroCurto(e.investido)}</dd></div>
        <div><dt>Caixa da empresa</dt><dd className={e.caixa < 0 ? 'perda' : undefined}>{e.caixa < 0 ? '− ' : ''}{dinheiroCurto(Math.abs(e.caixa))}</dd></div>
        {u && <div><dt>{cap(t.publicoNome[1])} no ano</dt><dd>{u.publico.toLocaleString('pt-BR')}</dd></div>}
        {u && <div><dt>Receita</dt><dd>{dinheiroCurto(u.receita)}</dd></div>}
        {u && <div><dt>Custos</dt><dd>{dinheiroCurto(u.custos)}</dd></div>}
        {u?.apoio ? <div><dt>Patrocínio e apoio</dt><dd>{dinheiroCurto(u.apoio)}</dd></div> : null}
        {u && <div><dt>Resultado</dt><dd className={u.resultado >= 0 ? 'ganho' : 'perda'}>{u.resultado < 0 ? '− ' : ''}{dinheiroCurto(Math.abs(u.resultado))}</dd></div>}
        {u && u.distribuido > 0 && <div><dt>Para você</dt><dd>{dinheiroCurto(Math.round(u.distribuido * e.parte))}</dd></div>}
      </dl>
      {!u && <p className="nota">{e.estado === 'abrindo' ? 'Em obra: o primeiro ano é de custo, sem público.' : 'O primeiro ano ainda não fechou.'}</p>}
      <p className="nota">Quem toca: {quemToca(e)}{e.papel !== 'investidor' && e.gestao.quem === 'contratada' ? ` — a gestão, até aqui: ${leituraDoGestor(vida, e)}` : ''}. Qualidade {e.qualidade >= 70 ? 'alta' : e.qualidade >= 50 ? 'boa' : e.qualidade >= 35 ? 'caindo' : 'baixa'}; reputação {e.reputacao >= 70 ? 'ótima' : e.reputacao >= 50 ? 'boa' : e.reputacao >= 35 ? 'mediana' : 'fraca'}. Preço {NOME_PRECO_EMPRESA[e.preco]}.{e.distribuir ? '' : ' O lucro fica na empresa.'}</p>
      {e.acervo && <p className="nota">Acervo: {e.acervo.pecas} peças, uns {dinheiroCurto(e.acervo.valor)}; conservação {e.acervo.conservacao >= 70 ? 'em dia' : e.acervo.conservacao >= 45 ? 'atrasada' : 'em risco'}{e.acervo.exposicao && vida.t - (e.acervo.tExposicao ?? 0) < 12 ? '; exposição temporária em cartaz' : ''}.</p>}
      {e.zoo && <p className="nota">{e.zoo.recintos} recintos, {e.zoo.especies} espécies. Bem-estar animal {e.zoo.bemEstar >= 75 ? 'bom' : e.zoo.bemEstar >= 55 ? 'aceitável' : 'abaixo do exigido'}; licença {e.zoo.licenca ? 'em dia' : 'suspensa'}{e.zoo.conservacao ? '; no programa de conservação' : ''}.</p>}
      {u?.nota && <p className="nota">{u.nota}</p>}
      {e.papel !== 'investidor' && e.estado !== 'encerrada' && (
        <details className="objeto__fazer">
          <summary className="objeto__fazer-titulo">Decidir sobre {e.nome}</summary>
          <div className="pat-decisoes">
            <div><p className="rotulo-pequeno">Quem toca</p>{decidir('assumir', 'Tocar você mesm' + (vida.eu.genero === 'feminino' ? 'a' : 'o'))}{decidir('contratar_gestor', e.gestao.quem === 'propria' ? 'Contratar alguém' : 'Trocar o gestor')}</div>
            <div><p className="rotulo-pequeno">Crescer e cuidar</p>{decidir('melhorar', `Reformar e equipar (${custo('melhorar')})`)}{decidir('contratar', 'Contratar mais gente')}{decidir('expandir', `Abrir outra unidade (${custo('expandir')})`)}{decidir('exposicao', `Montar uma exposição (${custo('exposicao')})`)}{decidir('bem_estar', `Ampliar os recintos (${custo('bem_estar')})`)}{decidir('conservacao', 'Entrar num programa de conservação')}</div>
            <div><p className="rotulo-pequeno">Preço e lucro</p>{decidir('preco_popular', 'Preço popular')}{decidir('preco_medio', 'Preço médio')}{decidir('preco_alto', 'Alto padrão')}{decidir('reinvestir', 'Reinvestir o lucro')}{decidir('distribuir', 'Distribuir o lucro')}</div>
            <div><p className="rotulo-pequeno">Quando aperta</p>{decidir('aportar', `Pôr dinheiro seu (${custo('aportar')})`)}{decidir('cortar', 'Cortar a equipe')}</div>
          </div>
        </details>
      )}
      <div className="pat-saida">
        {!saida ? <button type="button" className="link link--discreto" onClick={() => setSaida(true)}>Vender ou fechar…</button> : (
          <div className="pat-confirmar" role="group" aria-label="Sair da empresa">
            <p className="nota">Não se desfaz. Vender a sua parte: uns {dinheiroCurto(valorDeVendaDaParte(e))} (um comprador negocia para baixo).{e.papel !== 'investidor' ? ` Fechar: rescisões e contas${e.zoo ? ', e os animais transferidos para outras instituições' : ''}; o que sobrar das instalações volta.` : ''}</p>
            {decidir('vender_parte', 'Vender um quarto a um investidor (seguir no comando)', 'secundario')}
            {decidir('vender', 'Vender a minha parte', 'secundario')}
            {e.papel !== 'investidor' && decidir('encerrar', 'Fechar as portas', 'secundario')}
            <button type="button" className="botao botao--discreto" onClick={() => setSaida(false)}>Deixar como está</button>
          </div>
        )}
      </div>
    </article>
  );
}

function AbrirEmpresa({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [tipo, setTipo] = useState<TipoEmpresa>('restaurante');
  const sozinho = planoDeAbertura(vida, tipo, false);
  const t = tipoDeEmpresa(tipo);
  return (
    <div className="pat-abrir__corpo">
      <label className="campo"><span className="campo__rotulo">Que empresa</span>
        <select value={tipo} onChange={ev => setTipo(ev.target.value as TipoEmpresa)}>
          {TIPOS_DE_EMPRESA.map(x => <option key={x.id} value={x.id}>{x.rotulo}</option>)}
        </select>
      </label>
      <p className="nota">{t.descricao}</p>
      <dl className="objeto__numeros">
        <div><dt>Para abrir</dt><dd>{dinheiroCurto(sozinho.capital)}</dd></div>
        <div><dt>Custos fixos por ano</dt><dd>{dinheiroCurto(sozinho.custoAnual)}</dd></div>
        <div><dt>Uma casa madura fatura</dt><dd>uns {dinheiroCurto(sozinho.receitaTipica)}/ano</dd></div>
      </dl>
      <p className="nota">{t.obra ? 'Primeiro, um ano de obra: só custo. ' : ''}{t.responsavel ? `Precisa de ${t.responsavel.rotulo}: se não for você, é um salário a mais. ` : ''}O começo é com reputação a construir; o lucro, se vier, não é garantido. {t.apoio ? 'Este tipo quase nunca se paga só com ingresso: depende de patrocínio — e de quem cuide bem.' : ''}</p>
      {!sozinho.disponivel && <p className="nota nota--ruim">{sozinho.motivo}</p>}
      <div className="grupo-acoes grupo-acoes--linha">
        <BotaoAcao vida={vida} acao={{ tipo: 'empresa_abrir', empresa: tipo, comSocio: false }} agir={agir} variante="principal">Abrir sozinh{vida.eu.genero === 'feminino' ? 'a' : 'o'} ({dinheiroCurto(sozinho.capitalDaPessoa)})</BotaoAcao>
        <BotaoAcao vida={vida} acao={{ tipo: 'empresa_abrir', empresa: tipo, comSocio: true }} agir={agir} variante="secundario">Com um sócio, meio a meio ({dinheiroCurto(planoDeAbertura(vida, tipo, true).capitalDaPessoa)})</BotaoAcao>
      </div>
    </div>
  );
}
