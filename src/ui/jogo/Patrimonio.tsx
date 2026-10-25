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
import { anoDe } from '../../motor/tempo';
import { modeloVeiculo } from '../../motor/dados/bens';
import { economiaLocal, municipio } from '../../motor/dados/lugares';
import { custosDeVeiculo, guardadoLonge, nomeComCor, ondeEsta, custoDeTrazer } from '../../motor/sistemas/veiculos';
import { aluguelDeMercado } from '../../motor/sistemas/imoveis';
import { colecao, custoDoServico, estimativaDeVenda, lojaDeColecaoNaCidade, ofertasDeColecao, PROCEDENCIA_EM_PALAVRAS, propostasDeColecionadores, ROTULO_SERVICO, valorDaColecao, custoDaColecao, type OfertaDeColecao, type ServicoDeColecao } from '../../motor/sistemas/colecao';
import { LOJAS_DE_COLECAO, NOME_CATEGORIA_COLECAO, NOME_RARIDADE, pecaDeColecao, type LojaDeColecao } from '../../motor/dados/colecionaveis';
import type { CategoriaColecao } from '../../motor/tipos';
import { itemEstilo } from '../../motor/dados/estilo';
import { PainelDoRamo, VisaoGeralDasEmpresas } from './NegocioDoRamo';
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

/** REWORK 12.2: a parte aberta pode vir de fora (o atalho "Ver no patrimônio" depois de uma compra). */
export function Patrimonio({ vida, agir, abrir, parte: parteDeFora, irParte }: Props & { parte?: PartePatrimonio; irParte?: (p: PartePatrimonio) => void }) {
  const [parteLocal, setParteLocal] = useState<PartePatrimonio>('resumo');
  const parte = parteDeFora ?? parteLocal;
  const setParte = (p: PartePatrimonio) => { setParteLocal(p); irParte?.(p); };
  const i = idade(vida);
  if (i < 12) return <Pertences vida={vida} agir={agir} abrir={abrir} semVeiculos={false} />;
  const f = vida.financas;
  const itens: ItemDeSubnav<PartePatrimonio>[] = [
    { id: 'resumo', rotulo: 'Resumo', oque: 'O que tem, o que deve, o que dá para usar agora' },
    { id: 'imoveis', rotulo: 'Imóveis', conta: f.bens.filter(b => b.tipo === 'imovel').length },
    { id: 'garagem', rotulo: 'Garagem', conta: f.bens.filter(b => b.tipo === 'veiculo').length },
    { id: 'colecao', rotulo: 'Coleção', conta: colecao(vida).length },
    { id: 'empresas', rotulo: 'Empresas', conta: empresasAtivas(vida).length },
    { id: 'objetos', rotulo: 'Objetos', conta: (f.coisas ?? []).length + (vida.eu.estilo?.itens.length ?? 0) }
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
      {painel('objetos', <Objetos vida={vida} agir={agir} abrir={abrir} irColecao={() => setParte('colecao')} />)}
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

/* ------------------------------------------------------------------ Objetos */

/**
 * REWORK 12.2 · PAT-12.2-01 — "comprei um relógio e a aba Objetos ficou vazia": o que se compra na ótica, nas roupas e
 * na relojoaria/joalheria (o que se USA no corpo) ficava em `eu.estilo` e não aparecia aqui. Agora aparece, com o
 * usar e o guardar; as coisas da vida continuam embaixo; e, quando não há nada, a tela diz onde mora cada tipo de bem.
 */
function Objetos({ vida, agir, abrir, irColecao }: Props & { irColecao: () => void }) {
  const usados = vida.eu.estilo?.itens ?? [];
  const coisas = vida.financas.coisas ?? [];
  const pecas = colecao(vida).length;
  return (
    <>
      {usados.length > 0 && (
        <Secao titulo="O que você usa: roupas, óculos, relógios, joias">
          <ul className="pat-usados">
            {usados.map(x => {
              const it = itemEstilo(x.itemId);
              if (!it) return null;
              return (
                <li key={x.id} className="pat-usado">
                  <span><strong>{it.nome}</strong>{it.luxo ? <span className="etiqueta-luxo">luxo</span> : null}<span className="nota"> · {x.usando ? 'em uso' : 'guardado'} · desde {anoDe(x.t)} · pagou {dinheiroCurto(x.preco)}</span></span>
                  <BotaoAcao vida={vida} acao={{ tipo: 'usar_item', itemId: x.itemId, usar: !x.usando }} agir={agir} variante="discreto">{x.usando ? 'Guardar' : 'Usar'}</BotaoAcao>
                </li>
              );
            })}
          </ul>
          <p className="nota">É de usar, não de investir: na revenda, roupa e acessório valem pouco. Um relógio de coleção (com caixa, papéis e mercado de revenda) mora em Coleção.</p>
        </Secao>
      )}
      {(coisas.length > 0 || !usados.length) && <Pertences vida={vida} agir={agir} abrir={abrir} semVeiculos />}
      {pecas > 0 && <p className="nota pat-onde">As peças de coleção ({pecas}) ficam em <button type="button" className="link" onClick={irColecao}>Coleção →</button></p>}
      {!usados.length && !coisas.length && <p className="nota pat-onde">Onde fica cada coisa: o que se usa no corpo e as coisas da vida, aqui; relógios, joias, arte e antiguidades de coleção, em Coleção; carros e motos, em Garagem; casas, em Imóveis; negócios, em Empresas.</p>}
    </>
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
      {propostasDeColecionadores(vida).length > 0 && (
        <div className="pat-propostas">
          <p className="rotulo-pequeno">Propostas de compra deste ano</p>
          <ul className="ofertas">
            {propostasDeColecionadores(vida).map(p => (
              <li key={p.id} className="oferta oferta--estilo">
                <span className="oferta__texto"><strong>{cap(p.quem)} quer {p.nome}</strong><span className="nota">Sem comissão de casa; a proposta vale só este ano.</span></span>
                <span className="oferta__preco">{dinheiroCurto(p.valor)}</span>
                <span className="oferta__comprar grupo-acoes grupo-acoes--linha">
                  <BotaoAcao vida={vida} acao={{ tipo: 'colecao_proposta', propostaId: p.id, aceitar: true }} agir={agir} variante="secundario">Aceitar</BotaoAcao>
                  <BotaoAcao vida={vida} acao={{ tipo: 'colecao_proposta', propostaId: p.id, aceitar: false }} agir={agir} variante="discreto">Recusar</BotaoAcao>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
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
        <span className="pat-peca__meta">{[pecaDeColecao(c.pecaId)?.fabricante, pecaDeColecao(c.pecaId)?.periodo, pecaDeColecao(c.pecaId)?.material].filter(Boolean).join(' · ')}{c.autenticidade ? ` · autenticidade ${c.autenticidade === 'verificada' ? 'verificada' : c.autenticidade === 'presumida' ? 'presumida (a palavra de quem vendeu)' : 'duvidosa'}` : ''}{c.avaliada !== undefined ? ` · avaliada em ${anoDe(c.avaliada)}` : ''}</span>
      </div>
      <dl className="objeto__numeros">
        <div><dt>Vale (estimado)</dt><dd>{dinheiroCurto(c.valor)}</dd></div>
        {c.precoPago > 0 && <div><dt>{ganho >= 0 ? 'Acima do pago' : 'Abaixo do pago'}</dt><dd className={ganho >= 0 ? 'ganho' : 'perda'}>{dinheiroCurto(Math.abs(ganho))}</dd></div>}
        <div><dt>Estado</dt><dd>{c.estado >= 85 ? 'impecável' : c.estado >= 65 ? 'bom' : c.estado >= 45 ? 'marcado pelo tempo' : 'precisando de restauro'}</dd></div>
      </dl>
      {c.afeto && <p className="nota">Importa por outra razão: {c.afeto}.</p>}
      {c.emprestadaA && <p className="nota">Em exposição no museu (continua sua).</p>}
      {c.emprestadaFora && <p className="nota">Emprestada a {c.emprestadaFora.instituicao} até {anoDe(c.emprestadaFora.ate)}.</p>}
      {(c.historia ?? []).length > 1 && <details className="detalhes"><summary>A história da peça</summary><ul className="pat-historia">{(c.historia ?? []).map((h, k) => <li key={k}><span className="nota">{anoDe(h.t)}</span> {h.texto}</li>)}</ul></details>}
      <div className="grupo-acoes grupo-acoes--linha pat-servicos">
        {(['avaliar', 'autenticar', 'restaurar', 'emprestar'] as ServicoDeColecao[]).map(sv => <BotaoAcao key={sv} vida={vida} acao={{ tipo: 'colecao_servico', pecaId: c.id, servico: sv }} agir={agir} variante="discreto" ocultarBloqueado>{`${ROTULO_SERVICO[sv]}${custoDoServico(c, sv) > 0 ? ` (${dinheiroCurto(custoDoServico(c, sv))})` : ''}`}</BotaoAcao>)}
      </div>
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

/**
 * A loja de peças da cidade (aberta em Compras ou na Coleção): o que vende, o que se verifica em cada peça (quem fez,
 * quando, de quê, o estado, a autenticidade, a liquidez), o preço e o que vale depois de sair da loja. REWORK 12.2:
 * filtros (preço, categoria, raridade), a venda privada (sob consulta, para quem a casa reconhece) e o leilão especial.
 */
export function LojaDeColecaoDaCidade({ vida, agir, loja, aoComprar }: { vida: Vida; agir: (a: Acao) => boolean; loja: LojaDeColecao; aoComprar?: () => void }) {
  const todas = ofertasDeColecao(vida, loja);
  const l = LOJAS_DE_COLECAO[loja];
  const [faixa, setFaixa] = useState<'todas' | 'ate100' | 'ate1m' | 'acima'>('todas');
  const [cat, setCat] = useState<CategoriaColecao | 'todas'>('todas');
  const [rar, setRar] = useState<'todas' | 'comum' | 'rara'>('todas');
  const cats = [...new Set(todas.map(o => o.categoria))];
  const filtra = (o: OfertaDeColecao) => (faixa === 'todas' || (faixa === 'ate100' ? o.preco <= 100000 : faixa === 'ate1m' ? o.preco > 100000 && o.preco <= 1_000_000 : o.preco > 1_000_000)) && (cat === 'todas' || o.categoria === cat) && (rar === 'todas' || (rar === 'comum' ? o.raridade === 'comum' || o.raridade === 'incomum' : o.raridade === 'rara' || o.raridade === 'unica'));
  const vitrine = todas.filter(o => !o.canal).filter(filtra);
  const privadas = todas.filter(o => o.canal === 'privada').filter(filtra);
  const especiais = todas.filter(o => o.canal === 'especial').filter(filtra);
  const altas = (loja === 'relojoaria' || loja === 'joalheria' || loja === 'galeria' || loja === 'antiquario') && !todas.some(o => o.canal === 'privada');
  const agirEVer = (a: Acao) => { const ok = agir(a); if (ok) aoComprar?.(); return ok; };
  return (
    <div className="loja-estilo pat-loja">
      <p className="nota">{l.frase}</p>
      {todas.length > 3 && (
        <div className="pat-filtros" role="group" aria-label="Filtrar as peças">
          <label className="campo"><span className="campo__rotulo">Preço</span><select value={faixa} onChange={ev => setFaixa(ev.target.value as typeof faixa)}><option value="todas">Todos</option><option value="ate100">Até {dinheiroCurto(100000)}</option><option value="ate1m">{dinheiroCurto(100000)} a {dinheiroCurto(1_000_000)}</option><option value="acima">Acima de {dinheiroCurto(1_000_000)}</option></select></label>
          {cats.length > 1 && <label className="campo"><span className="campo__rotulo">Categoria</span><select value={cat} onChange={ev => setCat(ev.target.value as typeof cat)}><option value="todas">Todas</option>{cats.map(c => <option key={c} value={c}>{NOME_CATEGORIA_COLECAO[c].varios}</option>)}</select></label>}
          <label className="campo"><span className="campo__rotulo">Raridade</span><select value={rar} onChange={ev => setRar(ev.target.value as typeof rar)}><option value="todas">Todas</option><option value="comum">De série e pouco comuns</option><option value="rara">Raras e únicas</option></select></label>
        </div>
      )}
      {!todas.length && <p className="nota">{lojaDeColecaoNaCidade(vida.moradia.municipioId, loja) ? 'Nada à venda este ano.' : 'Não há uma destas na cidade: só nas metrópoles e capitais.'}</p>}
      {todas.length > 0 && !vitrine.length && !privadas.length && !especiais.length && <p className="nota">Nenhuma peça com esses filtros.</p>}
      <ListaDePecas vida={vida} agir={agirEVer} lista={vitrine} leilao={loja === 'leilao'} />
      {privadas.length > 0 && (
        <section className="pat-canal" aria-label="Sob consulta">
          <h3 className="subtitulo">Sob consulta · venda privada</h3>
          <p className="nota">A casa liga para quem pode comprar. Peças com histórico de donos, sem a margem da vitrine — e com o prêmio de quem vende.</p>
          <ListaDePecas vida={vida} agir={agirEVer} lista={privadas} />
        </section>
      )}
      {especiais.length > 0 && (
        <section className="pat-canal pat-canal--especial" aria-label="Leilão especial">
          <h3 className="subtitulo">O leilão especial da temporada</h3>
          <p className="nota">As peças históricas e únicas: uma de cada no mundo. Quem arremata entra na lista de donos — e ela não volta tão cedo.</p>
          <ListaDePecas vida={vida} agir={agirEVer} lista={especiais} leilao />
        </section>
      )}
      {altas && <p className="nota">As peças acima de alguns milhões não ficam na vitrine: a casa oferece sob consulta a clientes com patrimônio que ela reconheça.</p>}
    </div>
  );
}

function ListaDePecas({ vida, agir, lista, leilao }: { vida: Vida; agir: (a: Acao) => boolean; lista: OfertaDeColecao[]; leilao?: boolean }) {
  if (!lista.length) return null;
  return (
    <ul className="ofertas">
      {lista.map(o => (
        <li key={o.id} className="oferta oferta--estilo pat-oferta">
          <span className="oferta__texto">
            <strong>{cap(o.nome)}</strong>
            <span>{NOME_CATEGORIA_COLECAO[o.categoria].um} · {NOME_RARIDADE[o.raridade]} · {o.autenticidade === 'verificada' ? 'autenticidade verificada' : o.autenticidade === 'presumida' ? 'autenticidade presumida' : 'sem procedência'}</span>
            <span className="nota">{[o.fabricante, o.periodo, o.material].filter(Boolean).join(' · ')}{o.estado < 100 ? ` · estado ${o.estado >= 85 ? 'ótimo' : o.estado >= 70 ? 'bom' : 'marcado pelo tempo'}` : ' · nova'} · revenda {o.liquidez === 'alta' ? 'rápida' : o.liquidez === 'media' ? 'em semanas' : 'lenta (e com desconto, se tiver pressa)'}</span>
            {o.donos?.length ? <span className="nota">Antes: {o.donos.join(', depois ')}.</span> : null}
            <span className="nota">Depois de comprada, no mercado de revenda, deve valer uns {dinheiroCurto(o.valorEstimado)} — não é promessa.</span>
          </span>
          <span className="oferta__preco">{dinheiroCurto(o.preco)}{leilao ? <small>com a comissão</small> : null}</span>
          <span className="oferta__comprar"><BotaoAcao vida={vida} acao={{ tipo: 'colecao_comprar', ofertaId: o.id }} agir={agir} variante="secundario">{leilao ? 'Dar o lance' : 'Comprar'}</BotaoAcao></span>
        </li>
      ))}
    </ul>
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
      <VisaoGeralDasEmpresas vida={vida} />
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
      {e.setor && <PainelDoRamo vida={vida} agir={agir} e={e} />}
      {e.acervo && !e.setor?.museu && <p className="nota">Acervo: {e.acervo.pecas} peças, uns {dinheiroCurto(e.acervo.valor)}; conservação {e.acervo.conservacao >= 70 ? 'em dia' : e.acervo.conservacao >= 45 ? 'atrasada' : 'em risco'}{e.acervo.exposicao && vida.t - (e.acervo.tExposicao ?? 0) < 12 ? '; exposição temporária em cartaz' : ''}.</p>}
      {e.zoo && !e.setor?.zoo && <p className="nota">{e.zoo.recintos} recintos, {e.zoo.especies} espécies. Bem-estar animal {e.zoo.bemEstar >= 75 ? 'bom' : e.zoo.bemEstar >= 55 ? 'aceitável' : 'abaixo do exigido'}; licença {e.zoo.licenca ? 'em dia' : 'suspensa'}{e.zoo.conservacao ? '; no programa de conservação' : ''}.</p>}
      {u?.nota && <p className="nota">{u.nota}</p>}
      {e.papel !== 'investidor' && e.estado !== 'encerrada' && (
        <details className="objeto__fazer">
          <summary className="objeto__fazer-titulo">Decidir sobre {e.nome}</summary>
          <div className="pat-decisoes">
            <div><p className="rotulo-pequeno">Quem toca</p>{decidir('assumir', 'Tocar você mesm' + (vida.eu.genero === 'feminino' ? 'a' : 'o'))}{decidir('contratar_gestor', e.gestao.quem === 'propria' ? 'Contratar alguém' : 'Trocar o gestor')}</div>
            <div><p className="rotulo-pequeno">Crescer e cuidar</p>{decidir('melhorar', `Reformar e equipar (${custo('melhorar')})`)}{decidir('contratar', 'Contratar mais gente')}{decidir('expandir', `Abrir outra unidade (${custo('expandir')})`)}{!e.setor?.museu && decidir('exposicao', `Montar uma exposição (${custo('exposicao')})`)}{!e.setor?.zoo && decidir('bem_estar', `Ampliar os recintos (${custo('bem_estar')})`)}{decidir('conservacao', 'Entrar num programa de conservação')}</div>
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
