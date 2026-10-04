/**
 * Vida → Pertences (REWORK 4): o que é seu — e o que dá para FAZER com isso.
 *
 * "Se o jogador compra um violão, a primeira pergunta não pode ser 'quanto
 * consigo vendendo?'. Deve ser 'o que consigo fazer com o meu violão?'."
 * Cada coisa aparece como o objeto que é (a silhueta, a cor, o acabamento —
 * desta vida), com o estado, os USOS (tocar, tocar para alguém, jogar com
 * quem mora junto, fotografar...) e, por último e discreta, a venda. O que só
 * trabalha sozinho (a máquina de lavar, o ar-condicionado) diz o que faz.
 * Casa ficou com o que é da casa: onde, com quem, quanto custa.
 */

import { useState } from 'react';
import type { CoisaTida, Veiculo, Vida } from '../../motor/tipos';
import { modeloVeiculo, versaoVeiculo, formaDaVersao, NOME_FORMA } from '../../motor/dados/bens';
import { corConcordada, corDoVeiculo } from '../../motor/dados/pertences';
import { estadoDoVeiculo, nomeComCor, vecFeminino } from '../../motor/sistemas/veiculos';
import { disponibilidadeUsoVeiculo, rotuloUsoVeiculo, USOS_VEICULO } from '../../motor/sistemas/usos';
import { DesenhoVeiculo } from './material/Desenhos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { anoDe } from '../../motor/tempo';
import { coisa } from '../../motor/dados/coisas';
import { atividadesQueAjuda, coisasDaVida, efeitoEmPalavras, valorDeRevenda } from '../../motor/sistemas/coisas';
import { usosPara, varianteDe } from '../../motor/sistemas/pertences';
import { modeloRotina } from '../../motor/sistemas/rotinas';
import { BotaoAcao, Secao } from '../comum';
import { dinheiroCurto } from '../leituraMaterial';
import { DesenhoObjeto } from './material/Objetos';
import type { QualLugar } from './material/Lugares';

interface Props { vida: Vida; agir: (a: Acao) => boolean; abrir: (l: QualLugar) => void }

const ESTADO = (e: number) => (e >= 80 ? 'nova' : e >= 50 ? 'boa' : e >= 25 ? 'gasta' : 'no fim');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function Pertences({ vida, agir, abrir }: Props) {
  const lista = coisasDaVida(vida);
  const veiculos = vida.financas.bens.filter((b): b is Veiculo => b.tipo === 'veiculo');
  if (!lista.length && !veiculos.length) return (
    <Secao titulo="Pertences">
      <p className="nota">{idade(vida) >= 10 ? 'Nada seu ainda — um instrumento, um notebook, uma câmera, uma bola boa, uma bicicleta.' : 'O que é seu, por enquanto, quem compra são os adultos da casa.'} {idade(vida) >= 10 && <button type="button" className="link" onClick={() => abrir('eletronicos')}>As lojas</button>}</p>
    </Secao>
  );
  const ativos = lista.filter(t => usosPara(vida, t).length > 0);
  const passivos = lista.filter(t => usosPara(vida, t).length === 0);
  return (
    <div className="pertences">
      {veiculos.length > 0 && (
        <Secao titulo={veiculos.length === 1 ? 'Seu veículo' : 'Seus veículos'}>
          <ul className="pertences__lista pertences__lista--veiculos">{veiculos.map(b => <VeiculoSeu key={b.id} vida={vida} agir={agir} b={b} />)}</ul>
        </Secao>
      )}
      {ativos.length > 0 && (
        <Secao titulo="Para usar">
          <ul className="pertences__lista">{ativos.map(t => <Pertence key={t.id} vida={vida} agir={agir} t={t} />)}</ul>
        </Secao>
      )}
      {passivos.length > 0 && (
        <Secao titulo="Trabalhando sozinhos, em casa" recolhivel aberta={passivos.length <= 4}>
          <ul className="pertences__lista">{passivos.map(t => <Pertence key={t.id} vida={vida} agir={agir} t={t} />)}</ul>
        </Secao>
      )}
    </div>
  );
}

function Pertence({ vida, agir, t }: { vida: Vida; agir: (a: Acao) => boolean; t: CoisaTida }) {
  const [vender, setVender] = useState(false);
  const c = coisa(t.coisaId);
  if (!c) return null;
  const vari = varianteDe(t);
  const usos = usosPara(vida, t);
  const rende = atividadesQueAjuda(c).map(id => modeloRotina(id)?.nome.toLowerCase()).filter(Boolean).slice(0, 3);
  return (
    <li className="pertence" style={{ ['--cor-do-objeto' as string]: vari.cor }}>
      <div className="pertence__objeto"><DesenhoObjeto coisaId={t.coisaId} cor={vari.cor} tamanho={76} rotulo={`${c.nome}, ${vari.nome}`} /></div>
      <div className="pertence__corpo">
        <p className="pertence__nome"><strong>{cap(c.nome)}</strong> <span className="pertence__acabamento">{vari.nome}</span></p>
        <p className="pertence__meta">
          <span className="pertence__estado" aria-label={`Estado: ${ESTADO(t.estado)}`}><span style={{ width: `${Math.max(4, t.estado)}%` }} /></span>
          {ESTADO(t.estado)} · desde {anoDe(t.t)}
        </p>
        {usos.length === 0 && <p className="nota">{efeitoEmPalavras(vida, c)}</p>}
        {rende.length > 0 && usos.length > 0 && <p className="nota">Rende mais: {rende.join(', ')}.</p>}
        {usos.length > 0 && (
          <div className="pertence__usos">
            {usos.map(({ uso, companhias }) => uso.com
              ? <div key={uso.id} className="pertence__uso-com">
                  <span className="pertence__uso-rotulo">{uso.rotulo}</span>
                  {companhias.length ? companhias.slice(0, 4).map(p => (
                    <BotaoAcao key={p.id} vida={vida} acao={{ tipo: 'usar_coisa', coisaTidaId: t.id, uso: uso.id, pessoaId: p.id }} agir={agir} variante="secundario">{p.nome}</BotaoAcao>
                  )) : <span className="nota">ninguém por perto para isso</span>}
                </div>
              : <BotaoAcao key={uso.id} vida={vida} acao={{ tipo: 'usar_coisa', coisaTidaId: t.id, uso: uso.id }} agir={agir} variante="principal">{uso.rotulo}</BotaoAcao>)}
          </div>
        )}
        <div className="pertence__venda">
          {!vender
            ? <button type="button" className="link link--discreto" onClick={() => setVender(true)}>Vender ou se desfazer…</button>
            : <BotaoAcao vida={vida} acao={{ tipo: 'vender_coisa', coisaTidaId: t.id }} agir={agir} variante="discreto">Vender (uns {dinheiroCurto(valorDeRevenda(vida, t))})</BotaoAcao>}
        </div>
      </div>
    </li>
  );
}

/**
 * FIX pós-REWORK 4: "quero usar o meu carro — onde clico?". O veículo aparece aqui como o objeto que é (a silhueta, a
 * cor, o desgaste), com o que dá para fazer com ele (passear, pegar a estrada, trabalhar com ele, emprestar) e o
 * conserto, quando há. Custos, parcelas e venda continuam em Dinheiro.
 */
function VeiculoSeu({ vida, agir, b }: { vida: Vida; agir: (a: Acao) => boolean; b: Veiculo }) {
  const m = modeloVeiculo(b.modeloId);
  const forma = formaDaVersao(versaoVeiculo(b.versaoId), b.modeloId);
  const cor = corDoVeiculo(b, m.categoria);
  const usos = USOS_VEICULO.map(u => ({ u, d: disponibilidadeUsoVeiculo(vida, b, u) })).filter(x => x.d.ok || (x.u === 'passear' || x.u === 'viajar') && x.d.motivo && !/Não se aplica|De bicicleta/.test(x.d.motivo));
  const nome = cap(nomeComCor(b));
  return (
    <li className="pertence pertence--veiculo" style={{ ['--cor-do-objeto' as string]: cor.cor }}>
      <div className="pertence__objeto pertence__objeto--veiculo"><DesenhoVeiculo forma={forma} semente={b.id} cor={cor.cor} estado={b.estado} largura={96} rotulo={`${NOME_FORMA[forma]}, ${corConcordada(cor.nome, vecFeminino(b))}`} /></div>
      <div className="pertence__corpo">
        <p className="pertence__nome"><strong>{nome}</strong> {b.anoFabricacao ? <span className="pertence__acabamento">{b.anoFabricacao}</span> : null}</p>
        <p className="pertence__meta">
          <span className="pertence__estado" aria-label={`Estado: ${estadoDoVeiculo(b)}`}><span style={{ width: `${Math.max(4, b.estado)}%` }} /></span>
          {estadoDoVeiculo(b)} · desde {anoDe(b.tCompra)}
        </p>
        <div className="pertence__usos">
          {usos.map(({ u }) => <BotaoAcao key={u} vida={vida} acao={{ tipo: 'usar_veiculo', bemId: b.id, oque: u }} agir={agir} variante={u === 'passear' ? 'principal' : 'secundario'}>{rotuloUsoVeiculo(vida, b, u)}</BotaoAcao>)}
          {b.problema && <BotaoAcao vida={vida} acao={{ tipo: 'veiculo', bemId: b.id, oque: 'consertar' }} agir={agir} variante="secundario">{`Consertar (${b.problema.texto})`}</BotaoAcao>}
          <BotaoAcao vida={vida} acao={{ tipo: 'veiculo', bemId: b.id, oque: 'revisao' }} agir={agir} variante="discreto" ocultarBloqueado>Fazer a revisão</BotaoAcao>
        </div>
        <p className="nota pertence__venda">Quanto custa manter, as parcelas e a venda: em Dinheiro.</p>
      </div>
    </li>
  );
}
