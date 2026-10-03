/**
 * Vida · Cidade: onde se vive — o custo, os salários, o transporte, o seu
 * trajeto — e de onde se muda de cidade, sabendo antes o que fica para trás.
 * As lojas (imobiliária, concessionária, banco, óticas) moram em Compras.
 */

import { useMemo, useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { cidadesDoPais, economiaLocal, municipio, nomeDaDivisao, nomeLugar, siglaDaDivisao } from '../../motor/dados/lugares';
import { perfilDoPais } from '../../motor/mundo/registro';
import { CustoDeViverAqui, MudarDePais } from './Mundo';
import { consequenciasDaMudanca, custoDeMudanca } from '../../motor/sistemas/processos';
import { BotaoAcao, Folio, Secao } from '../comum';
import { deslocamento, NOME_MODO, tempoEmPalavras } from '../../motor/sistemas/transporte';
import { lugarDescrito, dinheiroCurto } from '../apresentar';
import '../material.css';

interface Props { vida: Vida; agir: (a: Acao) => boolean }

const PERFIL: Record<string, string> = { metropole: 'uma metrópole', metropolitana: 'uma cidade colada numa metrópole', capital: 'uma capital de estado', polo: 'uma cidade média, polo da região', pequena: 'uma cidade pequena do interior' };

export function Cidade({ vida, agir, irCompras }: Props & { irCompras?: () => void }) {
  const i = idade(vida);
  const m = municipio(vida.moradia.municipioId);
  const ec = economiaLocal(m.id);
  const anos = Math.max(0, Math.floor((vida.t - (vida.fatos['chegou_cidade'] ?? vida.eu.tNasc)) / 12));
  const desl = deslocamento(vida);
  return (
    <div className="cidade material">
      <Folio kicker={<><span className="folio__area">Vida · Cidade</span> · {siglaDaDivisao(m)}</>} titulo={m.nome} lede={`${PERFIL[m.perfil] ?? 'uma cidade'}${m.capital ? ' — a capital' : ''}. ${anos >= 1 ? `Você vive aqui há ${anos} ${anos === 1 ? 'ano' : 'anos'}.` : 'Você chegou há pouco.'}`} />
      <dl className="dados cidade__dados">
        <div className="dado"><dt>Custo de vida</dt><dd>{ec.custo > 1.15 ? 'alto' : ec.custo < 0.9 ? 'baixo' : 'médio'}</dd></div>
        <div className="dado"><dt>Salários</dt><dd>{ec.salario > 1.1 ? 'acima da média' : ec.salario < 0.9 ? 'abaixo da média' : 'na média'}</dd></div>
        <div className="dado"><dt>Aluguel de referência</dt><dd>{dinheiroCurto(ec.aluguel)}/mês</dd></div>
        <div className="dado"><dt>Transporte público</dt><dd>{ec.transporte === 'bom' ? 'bom: dá para viver sem carro' : ec.transporte === 'ruim' ? 'fraco: o ônibus demora' : 'razoável'}</dd></div>
        {desl && <div className="dado"><dt>O seu trajeto</dt><dd>{NOME_MODO[desl.modo]}{desl.nomeVeiculo ? ` (${desl.nomeVeiculo})` : ''} · {tempoEmPalavras(desl.minutos)}</dd></div>}
      </dl>
      <CustoDeViverAqui vida={vida} />

      <p className="nota">{i >= 12 ? 'A imobiliária, a concessionária, o banco, as lojas e o abrigo de animais ficam em ' : 'Por enquanto, a cidade é o caminho da escola e a rua de casa. As lojas ficam em '}{irCompras ? <button type="button" className="link" onClick={irCompras}>Vida · Compras →</button> : 'Vida · Compras'}.</p>
      {i >= 18 && <Mudar vida={vida} agir={agir} />}
      {i >= 18 && <MudarDePais vida={vida} agir={agir} />}
    </div>
  );
}

/** Mudar de cidade: o destino e, ANTES de mudar, o que acontece com esta vida. */
function Mudar({ vida, agir }: Props) {
  const [uf, setUf] = useState('');
  const [destino, setDestino] = useState('');
  // As cidades do país onde se mora (mudar de país é outra seção: `MudarDePais`).
  const pais = municipio(vida.moradia.municipioId).pais;
  const doPais = cidadesDoPais(pais);
  const ufs = useMemo(() => [...new Set(doPais.map(m => m.uf))].map(u => ({ u, nome: nomeDaDivisao(doPais.find(m => m.uf === u)!) })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')), [doPais]);
  const cidades = doPais.filter(m => m.uf === uf && m.id !== vida.moradia.municipioId);
  const tipo = perfilDoPais(pais).divisao.tipo[0];
  const aqui = economiaLocal(vida.moradia.municipioId);
  const efeitos = destino ? consequenciasDaMudanca(vida, destino) : [];
  return (
    <Secao titulo="Mudar de cidade" recolhivel aberta={false}>
      <p className="nota">Mudar leva quem mora com você e deixa o resto para trás. Escolha o destino para ver, antes, o que muda.</p>
      <div className="campos-linha">
        <label className="campo">
          <span className="campo__rotulo">{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</span>
          <select value={uf} onChange={e => { setUf(e.target.value); setDestino(''); }}>
            <option value="">Escolha</option>
            {ufs.map(x => <option key={x.u} value={x.u}>{x.nome}</option>)}
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
          {efeitos.length > 0 && (
            <div className="consequencias">
              <p className="consequencias__titulo">Se você se mudar para {nomeLugar(destino)}:</p>
              <ul>{efeitos.map((x, k) => <li key={k}>{x}</li>)}</ul>
            </div>
          )}
          <BotaoAcao vida={vida} acao={{ tipo: 'mudar_cidade', municipioId: destino }} agir={agir} aoAgir={() => { setUf(''); setDestino(''); }}>Mudar para {nomeLugar(destino)}</BotaoAcao>
        </>
      )}
    </Secao>
  );
}
