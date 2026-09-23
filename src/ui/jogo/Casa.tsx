/** Casa e dinheiro: de onde vem, para onde vai, e o que se tem. */

import { useMemo, useState } from 'react';
import type { LinhaRazao, Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { opcoesDeAluguel } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { MORADIAS, VEICULOS, modeloMoradia, precoImovel } from '../../motor/dados/bens';
import { economiaLocal, MUNICIPIOS, NOMES_UF, nomeLugar } from '../../motor/dados/lugares';
import { patrimonio, saldoMensal } from '../../motor/sistemas/dinheiro';
import { moraComFamiliaDeOrigem } from '../../motor/sistemas/domicilio';
import { custoDeMudanca } from '../../motor/sistemas/processos';
import { BotaoAcao, Escolha, Linha, Secao } from '../comum';
import { dinheiroCurto, lugarDescrito, ondeMora } from '../apresentar';

interface Props { vida: Vida; agir: (a: Acao) => boolean }

const GRUPOS: Record<LinhaRazao['grupo'], string> = {
  renda: 'Entradas', moradia: 'Moradia', casa: 'Casa e mercado', filhos: 'Filhos', transporte: 'Transporte', saude: 'Saúde',
  educacao: 'Estudo', dividas: 'Dívidas', lazer: 'Lazer e extras', outros: 'Outros'
};

export function Casa({ vida, agir }: Props) {
  const i = idade(vida);
  return (
    <div className="casa">
      <Moradia vida={vida} agir={agir} />
      <MesAMes vida={vida} agir={agir} />
      {i >= 16 && <Bens vida={vida} agir={agir} />}
      {i >= 18 && <Mudar vida={vida} agir={agir} />}
    </div>
  );
}

function Moradia({ vida, agir }: Props) {
  const [ver, setVer] = useState(false);
  const m = vida.moradia;
  const modelo = m.modeloId ? modeloMoradia(m.modeloId) : undefined;
  const naFamilia = moraComFamiliaDeOrigem(vida);
  const opcoes = opcoesDeAluguel(vida);
  return (
    <Secao titulo="Onde você mora">
      <p className="lugar">{lugarDescrito(m.municipioId)}</p>
      <p className="nota">{ondeMora(vida)[0].toUpperCase() + ondeMora(vida).slice(1)}{modelo ? `, num${modelo.nome.startsWith('casa') ? 'a' : ''} ${modelo.nome}` : ''}{m.aluguel > 0 ? ` · aluguel de ${dinheiroCurto(m.aluguel)}` : ''}.</p>
      {idade(vida) >= 18 && (
        <>
          <button type="button" className="botao botao--secundario" aria-expanded={ver} onClick={() => setVer(v => !v)}>{naFamilia ? 'Sair de casa' : 'Mudar de casa'}</button>
          {ver && (
            <ul className="lista-opcoes">
              {opcoes.map(o => (
                <li key={o.m.id} className="via">
                  <div className="via__texto"><strong>{o.m.nome[0].toUpperCase() + o.m.nome.slice(1)}</strong><span>{dinheiroCurto(o.aluguel)}/mês · {o.m.descricao}</span></div>
                  <BotaoAcao vida={vida} acao={{ tipo: naFamilia ? 'sair_de_casa' : 'trocar_moradia', modeloId: o.m.id }} agir={agir} aoAgir={() => setVer(false)}>Alugar</BotaoAcao>
                </li>
              ))}
            </ul>
          )}
          {!naFamilia && <BotaoAcao vida={vida} acao={{ tipo: 'voltar_pais' }} agir={agir} variante="discreto" ocultarImpossivel>Voltar a morar com a família</BotaoAcao>}
        </>
      )}
    </Secao>
  );
}

function MesAMes({ vida, agir }: Props) {
  const i = idade(vida);
  const f = vida.financas;
  const s = saldoMensal(vida);
  const grupos = new Map<string, number>();
  for (const l of s.linhas) if (l.grupo !== 'renda') grupos.set(l.grupo, (grupos.get(l.grupo) ?? 0) - l.valor);
  const [valor, setValor] = useState(0);
  const dividas = f.dividas.reduce((t, d) => t + d.saldo, 0);
  const sobra = s.renda - s.despesa;
  return (
    <Secao titulo="Dinheiro">
      <div className="numeros">
        <div className="numero"><span className="numero__rotulo">Na conta</span><span className="numero__valor">{dinheiroCurto(f.conta)}</span></div>
        {(f.reserva > 0 || i >= 18) && <div className="numero"><span className="numero__rotulo">Guardado</span><span className="numero__valor">{dinheiroCurto(f.reserva + f.acoes)}</span></div>}
        {dividas > 0 && <div className="numero numero--ruim"><span className="numero__rotulo">Dívidas</span><span className="numero__valor">{dinheiroCurto(dividas)}</span></div>}
        {i >= 18 && <div className="numero"><span className="numero__rotulo">Patrimônio</span><span className="numero__valor">{dinheiroCurto(patrimonio(vida))}</span></div>}
      </div>
      {f.negativado && <p className="nota nota--ruim">Seu nome está sujo: nada de crédito nem financiamento até renegociar.</p>}
      {(s.renda > 0 || s.despesa > 0) && (
        <div className="orcamento">
          <p className="orcamento__titulo">Por mês</p>
          {s.linhas.filter(l => l.grupo === 'renda').map(l => <Linha key={l.rotulo} rotulo={l.rotulo} valor={`+ ${dinheiroCurto(l.valor)}`} tom="bom" />)}
          {[...grupos.entries()].map(([g, v]) => <Linha key={g} rotulo={GRUPOS[g as LinhaRazao['grupo']]} valor={`− ${dinheiroCurto(v)}`} />)}
          <Linha rotulo={sobra >= 0 ? 'Sobra' : 'Falta'} valor={dinheiroCurto(Math.abs(sobra))} tom={sobra >= 0 ? 'bom' : 'ruim'} />
          <details className="detalhes">
            <summary>Ver cada gasto</summary>
            {s.linhas.filter(l => l.grupo !== 'renda').map(l => <Linha key={l.rotulo} rotulo={l.rotulo} valor={dinheiroCurto(-l.valor)} />)}
          </details>
        </div>
      )}
      {i < 18 && moraComFamiliaDeOrigem(vida) && <p className="nota">Quem paga as contas da casa são os adultos da família.</p>}
      {i >= 18 && (
        <>
          <div className="campo">
            <span className="campo__rotulo">Padrão de vida</span>
            <Escolha rotulo="Padrão de vida" valor={f.estilo} aoMudar={v => agir({ tipo: 'estilo', valor: v })}
              opcoes={[{ id: 'apertado', rotulo: 'Apertado' }, { id: 'modesto', rotulo: 'Modesto' }, { id: 'confortavel', rotulo: 'Confortável' }, { id: 'folgado', rotulo: 'Folgado' }]} />
          </div>
          <div className="grupo-acoes">
            <BotaoAcao vida={vida} acao={{ tipo: 'plano_saude', ativo: !f.planoDeSaude }} agir={agir} variante="discreto">{f.planoDeSaude ? 'Cancelar o plano de saúde' : 'Contratar plano de saúde'}</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'renegociar' }} agir={agir} ocultarImpossivel>Renegociar dívidas</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'cnh' }} agir={agir} variante="discreto" ocultarImpossivel>Tirar carteira de motorista</BotaoAcao>
          </div>
          <div className="investir">
            <label className="campo">
              <span className="campo__rotulo">Guardar ou resgatar</span>
              <input type="number" inputMode="numeric" min={0} step={100} value={valor || ''} placeholder="valor em reais" onChange={e => setValor(Math.max(0, Math.round(Number(e.target.value))))} />
            </label>
            <div className="grupo-acoes grupo-acoes--linha">
              <BotaoAcao vida={vida} acao={{ tipo: 'investir', destino: 'reserva', valor }} agir={agir}>Guardar na reserva</BotaoAcao>
              <BotaoAcao vida={vida} acao={{ tipo: 'investir', destino: 'acoes', valor }} agir={agir} variante="discreto">Aplicar em ações</BotaoAcao>
              <BotaoAcao vida={vida} acao={{ tipo: 'resgatar', origem: 'reserva', valor }} agir={agir} variante="discreto" ocultarImpossivel>Resgatar da reserva</BotaoAcao>
            </div>
          </div>
        </>
      )}
      {f.razao.length > 0 && (
        <details className="detalhes">
          <summary>O último ano, linha por linha</summary>
          {f.razao.map((l, k) => <Linha key={k} rotulo={l.rotulo} valor={dinheiroCurto(l.valor)} tom={l.valor >= 0 ? 'bom' : undefined} />)}
        </details>
      )}
    </Secao>
  );
}

function Bens({ vida, agir }: Props) {
  const [comprar, setComprar] = useState<'veiculo' | 'imovel' | null>(null);
  const f = vida.financas;
  const custo = economiaLocal(vida.moradia.municipioId).custo;
  return (
    <Secao titulo="O que você tem">
      {f.bens.length === 0 && <p className="nota">Nada no seu nome.</p>}
      <ul className="lista-bens">
        {f.bens.map(b => {
          const divida = f.dividas.find(d => d.bemId === b.id);
          return (
            <li key={b.id} className="bem">
              <div className="bem__texto">
                <strong>{b.nome[0].toUpperCase() + b.nome.slice(1)}</strong>
                <span>vale {dinheiroCurto(b.valor)}{divida ? ` · faltam ${dinheiroCurto(divida.saldo)} (${dinheiroCurto(divida.parcela)}/mês)` : ''}{b.tipo === 'imovel' && b.alugadoPor ? ` · alugado por ${dinheiroCurto(b.alugadoPor)}` : ''}{b.tipo === 'imovel' && vida.moradia.imovelId === b.id ? ' · você mora aqui' : ''}{b.tipo === 'veiculo' && b.estado < 40 ? ' · precisando de oficina' : ''}</span>
              </div>
              <BotaoAcao vida={vida} acao={{ tipo: 'vender_bem', bemId: b.id }} agir={agir} variante="discreto">Vender</BotaoAcao>
            </li>
          );
        })}
      </ul>
      {idade(vida) >= 18 && (
        <div className="grupo-acoes grupo-acoes--linha">
          <button type="button" className="botao botao--secundario" aria-expanded={comprar === 'veiculo'} onClick={() => setComprar(c => (c === 'veiculo' ? null : 'veiculo'))}>Comprar veículo</button>
          <button type="button" className="botao botao--secundario" aria-expanded={comprar === 'imovel'} onClick={() => setComprar(c => (c === 'imovel' ? null : 'imovel'))}>Comprar imóvel</button>
        </div>
      )}
      {comprar === 'veiculo' && (
        <ul className="lista-opcoes">
          {VEICULOS.map(m => (
            <li key={m.id} className="via">
              <div className="via__texto"><strong>{m.nome[0].toUpperCase() + m.nome.slice(1)}</strong><span>{dinheiroCurto(m.preco)} · uso de {dinheiroCurto(m.usoMensal * custo)}/mês{m.taxaAnual ? ` + IPVA e seguro` : ''} · {m.descricao}</span></div>
              <div className="via__botoes">
                <BotaoAcao vida={vida} acao={{ tipo: 'comprar_veiculo', modeloId: m.id, financiar: false }} agir={agir} aoAgir={() => setComprar(null)}>À vista</BotaoAcao>
                {m.preco > 10000 && <BotaoAcao vida={vida} acao={{ tipo: 'comprar_veiculo', modeloId: m.id, financiar: true }} agir={agir} variante="discreto" aoAgir={() => setComprar(null)}>Financiar</BotaoAcao>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {comprar === 'imovel' && (
        <ul className="lista-opcoes">
          {MORADIAS.filter(m => m.preco > 0).map(m => (
            <li key={m.id} className="via">
              <div className="via__texto"><strong>{m.nome[0].toUpperCase() + m.nome.slice(1)}</strong><span>{dinheiroCurto(precoImovel(m, custo))} em {nomeLugar(vida.moradia.municipioId)} · {m.descricao}</span></div>
              <div className="via__botoes">
                <BotaoAcao vida={vida} acao={{ tipo: 'comprar_imovel', modeloId: m.id, financiar: true, morar: true }} agir={agir} aoAgir={() => setComprar(null)}>Financiar e morar</BotaoAcao>
                <BotaoAcao vida={vida} acao={{ tipo: 'comprar_imovel', modeloId: m.id, financiar: false, morar: true }} agir={agir} variante="discreto" aoAgir={() => setComprar(null)}>À vista</BotaoAcao>
                <BotaoAcao vida={vida} acao={{ tipo: 'comprar_imovel', modeloId: m.id, financiar: false, morar: false }} agir={agir} variante="discreto" aoAgir={() => setComprar(null)}>Comprar para alugar</BotaoAcao>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Secao>
  );
}

function Mudar({ vida, agir }: Props) {
  const [uf, setUf] = useState('');
  const [destino, setDestino] = useState('');
  const ufs = useMemo(() => [...new Set(MUNICIPIOS.map(m => m.uf))].sort((a, b) => NOMES_UF[a].localeCompare(NOMES_UF[b])), []);
  const cidades = MUNICIPIOS.filter(m => m.uf === uf && m.id !== vida.moradia.municipioId);
  return (
    <Secao titulo="Mudar de cidade" recolhivel aberta={false}>
      <p className="nota">Mudar leva quem mora com você e deixa o resto para trás: o emprego local acaba, os amigos ficam longe. O custo de vida e as oportunidades mudam com a cidade.</p>
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
          <p className="nota">{lugarDescrito(destino)}. Custo de vida {economiaLocal(destino).custo > economiaLocal(vida.moradia.municipioId).custo ? 'maior' : 'menor'} que o daqui; salários {economiaLocal(destino).salario > economiaLocal(vida.moradia.municipioId).salario ? 'maiores' : 'menores'}. A mudança custa cerca de {dinheiroCurto(custoDeMudanca(vida.moradia.municipioId, destino))}.</p>
          <BotaoAcao vida={vida} acao={{ tipo: 'mudar_cidade', municipioId: destino }} agir={agir} aoAgir={() => { setUf(''); setDestino(''); }}>Mudar para {nomeLugar(destino)}</BotaoAcao>
        </>
      )}
    </Secao>
  );
}
