/**
 * VIDA 22 · A FICHA DO IMÓVEL — o que se sabe da casa onde se mora, organizado: o tipo, onde fica, de quem é, o valor
 * estimado (separado do dinheiro na conta e do patrimônio), a área e o terreno, os cômodos e as estruturas de fora, as
 * melhorias feitas, a ocupação (quantos moram, quantos quartos), a conservação e o que ela custa por mês.
 *
 * Só lê o que o motor já guarda (`moradia`, o `Imovel`, a planta e os cômodos de `sistemas/lar`, o conforto, o
 * orçamento): nada de indicador inventado. O que não existe para este tipo de moradia (o valor de uma casa alugada, o
 * terreno de um apartamento) simplesmente não aparece.
 */
import type { Imovel, Vida } from '../../../motor/tipos';
import { modeloMoradia, AREA_MORADIA } from '../../../motor/dados/bens';
import { COMODOS, plantaDe, type TipoComodo } from '../../../motor/dados/lar';
import { NOME_DO_ASPECTO_EXTERNO, OPCOES_EXTERNAS, ASPECTOS_EXTERNOS } from '../../../motor/dados/casa128';
import { casaDaFamilia, comodosDaCasa, confortoDaCasa, custoMensalDoLar, donoDoLar, imovelDaMoradia, moradores, terrenoLivre } from '../../../motor/sistemas/lar';
import { balanco, mesesRestantes } from '../../../motor/sistemas/dinheiro';
import { casaApertada } from '../../../motor/sistemas/imoveis';
import { economiaLocal, municipio, nomeLugar, rotuloPerfil } from '../../../motor/dados/lugares';
import { anoDe } from '../../../motor/tempo';
import { dinheiroCheio, dinheiroCurto } from '../../leituraMaterial';
import './ficha22.css';

const DE_FORA: TipoComodo[] = ['garagem', 'piscina', 'lazer', 'quadra', 'varanda', 'jardim'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const m2 = (x: number) => `${Math.round(x).toLocaleString('pt-BR')} m²`;

/** A conservação em palavras, pelo estado (0–100) do imóvel. */
function conservacao(estado: number): { palavra: string; tom?: 'ruim' | 'atencao' } {
  if (estado >= 85) return { palavra: 'muito bem conservado' };
  if (estado >= 70) return { palavra: 'bem conservado' };
  if (estado >= 55) return { palavra: 'com sinais de uso', tom: 'atencao' };
  if (estado >= 40) return { palavra: 'gasto, pedindo cuidado', tom: 'atencao' };
  return { palavra: 'precisando de reforma', tom: 'ruim' };
}

export function FichaDoImovel22({ vida }: { vida: Vida }) {
  if (casaDaFamilia(vida)) return null;
  const m = vida.moradia;
  const modelo = m.modeloId ? modeloMoradia(m.modeloId) : undefined;
  if (!modelo) return null;
  const im: Imovel | undefined = imovelDaMoradia(vida);
  const lar = donoDoLar(vida)?.lar;
  const planta = plantaDe(m.modeloId);
  const comodos = comodosDaCasa(vida);
  const mun = municipio(m.municipioId);
  const c = economiaLocal(m.municipioId).custo;
  const b = balanco(vida);
  const divida = im ? vida.financas.dividas.find(d => d.bemId === im.id) : undefined;
  const quartos = comodos.filter(x => x.tipo === 'quarto' || x.tipo === 'quarto_extra').length || modelo.quartos;
  const banheiros = comodos.filter(x => x.tipo === 'banheiro');
  const suites = banheiros.filter(x => x.suiteDe).length;
  const convertidos = comodos.filter(x => x.de === 'conversao');
  const internos = comodos.filter(x => !DE_FORA.includes(x.tipo) && !['quarto', 'quarto_extra', 'banheiro'].includes(x.tipo));
  const fora = comodos.filter(x => DE_FORA.includes(x.tipo));
  const obras = (lar?.extras ?? []).filter(x => x.de === 'obra');
  const acabados = Object.values(lar?.acabamentos ?? {}).filter(a => Object.keys(a).length).length;
  const externo = ASPECTOS_EXTERNOS.filter(a => lar?.externo?.[a] && OPCOES_EXTERNAS[a].find(o => o.id === lar.externo![a])?.nivel !== 1 && !OPCOES_EXTERNAS[a].find(o => o.id === lar.externo![a])?.fixo);
  const gente = moradores(vida);
  const apertada = casaApertada(vida);
  const conforto = confortoDaCasa(vida);
  const custoObras = custoMensalDoLar(m.modeloId, lar, c);
  const condominio = modelo.condominio && m.tipo !== 'republica' ? modelo.condominio * c : 0;
  const imposto = im ? im.valor * 0.006 / 12 : 0;
  const situacao = m.tipo === 'propria' ? (divida ? 'Própria, financiada' : im?.herdado ? 'Própria (herdada)' : im?.dono === 'casal' ? 'Própria, do casal' : 'Própria, quitada') : m.tipo === 'aluguel' ? 'Alugada' : m.tipo === 'republica' ? 'Quarto alugado numa república' : 'Cedida';
  const cons = im ? conservacao(im.estado) : undefined;
  return (
    <section className="ficha22" aria-labelledby="ficha22-titulo">
      <h2 id="ficha22-titulo" className="ficha22__titulo">Sobre o imóvel</h2>
      <div className="ficha22__grade">
        <dl className="ficha22__bloco">
          <div><dt>Tipo</dt><dd>{cap(modelo.nome)}{modelo.casa ? ' (casa)' : ' (apartamento)'}</dd></div>
          <div><dt>Onde fica</dt><dd>{nomeLugar(mun.id)}{m.bairro ? `, ${m.bairro}` : ''} <span className="nota">· {rotuloPerfil(mun.perfil)}</span></dd></div>
          <div><dt>Situação</dt><dd>{situacao}{m.tipo === 'aluguel' || m.tipo === 'republica' ? ` · ${dinheiroCurto(m.divide ? m.aluguel / 2 : m.aluguel)} por mês` : ''}</dd></div>
          {im && <div><dt>Desde</dt><dd>{anoDe(im.tCompra)}{im.precoPago ? ` · pago ${dinheiroCurto(im.precoPago)}` : ''}</dd></div>}
        </dl>
        {/* O dinheiro: o valor da casa é patrimônio, não é dinheiro disponível — os três lado a lado, cada um com o que é. */}
        <dl className="ficha22__bloco ficha22__dinheiro" aria-label="Valor do imóvel, dinheiro e patrimônio">
          {im ? <div><dt>Valor estimado do imóvel</dt><dd><strong>{dinheiroCheio(im.valor)}</strong><span className="nota">Quanto vale hoje, se fosse vendido (antes da corretagem e dos impostos). Não é dinheiro na conta.</span></dd></div>
            : <div><dt>Valor do imóvel</dt><dd><span className="nota">A casa não é sua: o valor dela não entra no seu patrimônio.</span></dd></div>}
          {divida && <div><dt>Ainda devendo</dt><dd>{dinheiroCheio(divida.saldo)} <span className="nota">· faltam {Math.ceil(mesesRestantes(vida, divida) / 12)} anos</span></dd></div>}
          <div><dt>Na conta agora</dt><dd>{dinheiroCheio(Math.max(0, b.conta))}</dd></div>
          <div><dt>Patrimônio líquido</dt><dd>{dinheiroCheio(b.liquido)} <span className="nota">· tudo o que tem, menos o que deve</span></dd></div>
        </dl>
        <dl className="ficha22__bloco">
          <div><dt>Área</dt><dd>{m2(AREA_MORADIA[modelo.id] ?? 60)} de área útil{planta.terreno > 0 ? ` · ${m2(terrenoLivre(m.modeloId, lar))} de terreno livre para obra` : ''}</dd></div>
          <div><dt>Quartos e banheiros</dt><dd>{quartos} {quartos === 1 ? 'quarto' : 'quartos'}{planta.integrado ? ' (cômodo integrado)' : ''} · {banheiros.length || 1} {banheiros.length === 1 ? 'banheiro' : 'banheiros'}{suites ? ` (${suites} ${suites === 1 ? 'suíte' : 'suítes'})` : ''}{comodos.some(x => x.tipo === 'lavabo') ? ' · lavabo' : ''}</dd></div>
          {internos.length > 0 && <div><dt>Outros cômodos</dt><dd>{internos.map(x => x.nome).join(', ')}</dd></div>}
          <div><dt>Vagas de garagem</dt><dd>{planta.vagas || 'nenhuma'}</dd></div>
          {fora.length > 0 && <div><dt>Do lado de fora</dt><dd>{fora.map(x => COMODOS[x.tipo]?.nome ?? x.nome).join(', ')}</dd></div>}
        </dl>
        <dl className="ficha22__bloco">
          <div><dt>Ocupação</dt><dd>{gente} {gente === 1 ? 'pessoa mora' : 'pessoas moram'} aqui · {quartos} {quartos === 1 ? 'quarto' : 'quartos'}{apertada ? <span className="ficha22__alerta"> · {apertada}</span> : ''}</dd></div>
          <div><dt>Conforto</dt><dd>{cap(conforto.palavra)} <span className="nota">({conforto.valor} de 100)</span></dd></div>
          {im && cons && <div><dt>Conservação</dt><dd className={cons.tom ? `ficha22__${cons.tom}` : undefined}>{cap(cons.palavra)}{im.problema ? ` · ${im.problema.texto}` : ''}{im.tManutencao ? <span className="nota"> · última manutenção grande em {anoDe(im.tManutencao)}</span> : ''}</dd></div>}
          {(condominio > 0 || imposto > 0 || custoObras > 0) && <div><dt>Custos fixos da casa</dt><dd>{[condominio > 0 ? `condomínio ${dinheiroCurto(condominio)}` : '', imposto > 0 ? `imposto e manutenção ${dinheiroCurto(imposto)}` : '', custoObras > 0 ? `o que você acrescentou ${dinheiroCurto(custoObras)}` : ''].filter(Boolean).join(' · ')} por mês</dd></div>}
        </dl>
      </div>
      {(obras.length > 0 || convertidos.length > 0 || acabados > 0 || externo.length > 0) && (
        <div className="ficha22__melhorias">
          <h3 className="ficha22__sub">Melhorias feitas</h3>
          <ul>
            {obras.map(x => <li key={x.id}>Construiu {COMODOS[x.tipo as TipoComodo]?.artigo ?? 'o'} {COMODOS[x.tipo as TipoComodo]?.nome ?? x.tipo} <span className="nota">({anoDe(x.t)})</span></li>)}
            {convertidos.map(x => <li key={x.id}>Transformou um quarto em {x.nome}</li>)}
            {acabados > 0 && <li>Trocou os acabamentos de {acabados} {acabados === 1 ? 'cômodo' : 'cômodos'} (piso, parede, luz)</li>}
            {externo.map(a => <li key={a}>{NOME_DO_ASPECTO_EXTERNO[a]}: {OPCOES_EXTERNAS[a].find(o => o.id === lar!.externo![a])?.nome}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
