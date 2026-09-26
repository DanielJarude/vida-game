/**
 * Cidade: onde se vive — e o que a cidade oferece.
 *
 * Casa é moradia, patrimônio e vida doméstica. A imobiliária, a
 * concessionária, o banco, o abrigo, a loja de animais e a autoescola são da
 * CIDADE: lugares aonde se vai. E é daqui que se muda de cidade — sabendo,
 * antes, o que fica para trás.
 */

import { useMemo, useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { economiaLocal, municipio, MUNICIPIOS, NOMES_UF, nomeLugar } from '../../motor/dados/lugares';
import { consequenciasDaMudanca, custoDeMudanca } from '../../motor/sistemas/processos';
import { BotaoAcao, Folio, Secao } from '../comum';
import { lugarDescrito, dinheiroCurto } from '../apresentar';
import { Icone } from './material/Desenhos';
import { Lugar, type QualLugar } from './material/Lugares';
import '../material.css';

interface Props { vida: Vida; agir: (a: Acao) => boolean }

const PERFIL: Record<string, string> = { metropole: 'uma metrópole', metropolitana: 'uma cidade colada numa metrópole', capital: 'uma capital de estado', polo: 'uma cidade média, polo da região', pequena: 'uma cidade pequena do interior' };

export function Cidade({ vida, agir }: Props) {
  const i = idade(vida);
  const [lugar, setLugar] = useState<QualLugar | null>(null);
  const m = municipio(vida.moradia.municipioId);
  const ec = economiaLocal(m.id);
  const anos = Math.max(0, Math.floor((vida.t - (vida.fatos['chegou_cidade'] ?? vida.eu.tNasc)) / 12));
  const temVeiculo = vida.financas.bens.some(b => b.tipo === 'veiculo');
  const lugares: { id: QualLugar; nome: string; oque: string; icone: string; so18?: boolean }[] = [
    { id: 'alugar', nome: 'Imobiliária', oque: 'Alugar ou comprar onde morar', icone: 'imobiliaria', so18: true },
    { id: 'concessionaria', nome: 'Concessionária', oque: 'Carros zero', icone: 'concessionaria', so18: true },
    { id: 'usados', nome: 'Usados', oque: 'Anúncios de carros', icone: 'usados', so18: true },
    { id: 'motos', nome: 'Motos e bicicletas', oque: 'Novas e usadas', icone: 'bicicleta' },
    ...(temVeiculo ? [{ id: 'oficina' as QualLugar, nome: 'Oficina', oque: 'Revisão e conserto', icone: 'oficina' }] : []),
    { id: 'banco', nome: 'Banco', oque: 'Guardar, investir, empréstimo', icone: 'banco', so18: true },
    { id: 'abrigo', nome: 'Abrigo de animais', oque: 'Adotar um cão, um gato — às vezes, outro bicho', icone: 'abrigo', so18: true },
    { id: 'pets', nome: 'Loja e criadouro de animais', oque: 'Aves, roedores, peixes; silvestres só com documento', icone: 'loja_pets', so18: true }
  ];
  return (
    <div className="cidade material">
      <Folio kicker={<><span className="folio__area">Cidade</span> · {m.uf}</>} titulo={m.nome} lede={`${PERFIL[m.perfil] ?? 'uma cidade'}${m.capital ? ' — a capital' : ''}. ${anos >= 1 ? `Você vive aqui há ${anos} ${anos === 1 ? 'ano' : 'anos'}.` : 'Você chegou há pouco.'}`} />
      <dl className="dados cidade__dados">
        <div className="dado"><dt>Custo de vida</dt><dd>{ec.custo > 1.15 ? 'alto' : ec.custo < 0.9 ? 'baixo' : 'médio'}</dd></div>
        <div className="dado"><dt>Salários</dt><dd>{ec.salario > 1.1 ? 'acima da média' : ec.salario < 0.9 ? 'abaixo da média' : 'na média'}</dd></div>
        <div className="dado"><dt>Aluguel de referência</dt><dd>{dinheiroCurto(ec.aluguel)}/mês</dd></div>
        <div className="dado"><dt>Transporte</dt><dd>{ec.transporte === 'bom' ? 'bom: dá para viver sem carro' : ec.transporte === 'ruim' ? 'ruim: ônibus demora' : 'razoável'}</dd></div>
      </dl>

      {i >= 16 ? (
        <Secao titulo="Pela cidade">
          <p className="nota">Onde se procura casa, carro, um lugar para guardar dinheiro — e um bicho.</p>
          {i >= 18 && <BotaoAcao vida={vida} acao={{ tipo: 'cnh' }} agir={agir} variante="discreto" ocultarBloqueado>Tirar carteira de motorista (autoescola)</BotaoAcao>}
          <ul className="lugares">
            {lugares.filter(l => !l.so18 || i >= 18).map(l => (
              <li key={l.id}>
                <button type="button" className="lugar-botao" onClick={() => setLugar(l.id)}>
                  <Icone nome={l.icone} tamanho={26} />
                  <span className="lugar-botao__nome">{l.nome}</span>
                  <span className="lugar-botao__oque">{l.oque}</span>
                </button>
              </li>
            ))}
          </ul>
        </Secao>
      ) : <p className="nota">Por enquanto, a cidade é o caminho da escola e a rua de casa.</p>}

      {i >= 18 && <Mudar vida={vida} agir={agir} />}
      {lugar && <Lugar vida={vida} agir={agir} qual={lugar} aoFechar={() => setLugar(null)} trocar={setLugar} />}
    </div>
  );
}

/** Mudar de cidade: o destino e, ANTES de mudar, o que acontece com esta vida. */
function Mudar({ vida, agir }: Props) {
  const [uf, setUf] = useState('');
  const [destino, setDestino] = useState('');
  const ufs = useMemo(() => [...new Set(MUNICIPIOS.map(m => m.uf))].sort((a, b) => NOMES_UF[a].localeCompare(NOMES_UF[b])), []);
  const cidades = MUNICIPIOS.filter(m => m.uf === uf && m.id !== vida.moradia.municipioId);
  const aqui = economiaLocal(vida.moradia.municipioId);
  const efeitos = destino ? consequenciasDaMudanca(vida, destino) : [];
  return (
    <Secao titulo="Mudar de cidade" recolhivel aberta={false}>
      <p className="nota">Mudar leva quem mora com você e deixa o resto para trás. Escolha o destino para ver, antes, o que muda.</p>
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
