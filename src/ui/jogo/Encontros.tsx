/**
 * VIDA 12.9 — RECEBER GENTE E SAIR JUNTO (Pessoas): o jantar, a festa, o churrasco, a piscina, o cinema em casa, a noite
 * de jogos, o bar, o cinema. Escolhe o encontro, marca quem vai (os mais próximos primeiro), o jeito (do dia a dia,
 * caprichado, com buffet) — e vê o custo antes. O que dá ou não dá (a casa não tem churrasqueira, já fez neste ano, não
 * cabe) aparece no próprio cartão.
 */
import { useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { podeTentar } from '../../motor/plausibilidade';
import { idadePessoa } from '../../motor/nucleo';
import { custoDoEncontro, encontrosPossiveis } from '../../motor/sistemas/encontros129';
import { MULT_DO_JEITO, type JeitoDoEncontro, type TipoDeEncontro } from '../../motor/dados/encontros129';
import { BotaoAcao, Escolha } from '../comum';
import { dinheiroCurto } from '../leituraMaterial';
import '../possibilidades.css';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const RELACAO: Record<string, string> = { mae: 'mãe', pai: 'pai', irmao: 'irmão', irma: 'irmã', filho: 'filho', filha: 'filha', avo: 'avô/avó', tio: 'tio/tia', primo: 'primo/prima', conjuge: 'cônjuge' };

export function Encontros({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const lista = encontrosPossiveis(vida);
  const [aberto, setAberto] = useState<TipoDeEncontro | null>(null);
  return (
    <div className="encontros">
      <p className="nota">Um de cada por ano. O que a casa tem decide o que dá para fazer em casa; o tamanho dela, quantos cabem.</p>
      <ul className="encontros__lista">
        {lista.map(x => {
          const ok = podeTentar(x.veredito);
          return (
            <li key={x.modelo.id} className={`encontros__cartao${ok ? '' : ' encontros__cartao--bloqueado'}`} data-encontro={x.modelo.id}>
              <span className="encontros__cabeca">
                <strong>{cap(x.modelo.nome)}</strong>
                <span className="nota">{x.modelo.emCasa ? (x.lugar ? `em casa · ${x.lugar}` : 'em casa') : 'fora de casa'} · {dinheiroCurto(x.porPessoa)} por pessoa{x.modelo.emCasa && x.capacidade ? ` · cabem até ${x.capacidade}` : ''}</span>
              </span>
              {!ok && <span className="nota encontros__motivo">{x.veredito.motivo}</span>}
              {ok && aberto !== x.modelo.id && <button type="button" className="botao botao--secundario" onClick={() => setAberto(x.modelo.id)}>{x.modelo.rotulo}</button>}
              {ok && aberto === x.modelo.id && <Montar vida={vida} agir={a => { const r = agir(a); if (r) setAberto(null); return r; }} item={x} fechar={() => setAberto(null)} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Montar({ vida, agir, item, fechar }: { vida: Vida; agir: (a: Acao) => boolean; item: ReturnType<typeof encontrosPossiveis>[number]; fechar: () => void }) {
  const m = item.modelo;
  const max = item.capacidade;
  const [marcados, setMarcados] = useState<string[]>(() => item.candidatos.slice(0, Math.min(max, Math.max(m.convidados[0], m.id === 'jantar' || m.id === 'cinema' ? 2 : 6))).map(p => p.id));
  const [jeito, setJeito] = useState<JeitoDoEncontro>('simples');
  const [rachar, setRachar] = useState(m.id === 'saida');
  const alternar = (id: string) => setMarcados(xs => (xs.includes(id) ? xs.filter(x => x !== id) : xs.length >= max ? xs : [...xs, id]));
  const jeitos: JeitoDoEncontro[] = m.emCasa ? ['simples', 'caprichado', 'buffet'] : ['simples', 'caprichado'];
  const total = custoDoEncontro(vida, m, marcados.length, jeito, rachar);
  const acao: Acao = { tipo: 'encontro', oque: m.id, convidados: marcados, jeito, ...(rachar ? { rachar: true } : {}) };
  return (
    <div className="encontros__montar">
      <fieldset className="encontros__convidados">
        <legend>Quem vai ({marcados.length}{max ? ` de até ${max}` : ''})</legend>
        <ul>
          {item.candidatos.slice(0, 40).map(p => {
            const vin = vida.vinculos[p.id];
            const rel = vin?.romance && vin.romance.estagio !== 'ex' ? 'par' : vin?.romance?.estagio === 'ex' ? 'ex' : vin?.parentesco ? RELACAO[vin.parentesco] ?? vin.parentesco.replace(/_/g, ' ') : vin?.convivio.length ? 'do dia a dia' : 'amizade';
            return (
              <li key={p.id}><label className="marcar"><input type="checkbox" checked={marcados.includes(p.id)} onChange={() => alternar(p.id)} disabled={!marcados.includes(p.id) && marcados.length >= max} /> {p.nome} <span className="nota">· {rel}, {idadePessoa(vida, p)}{(vin?.tensao ?? 0) >= 40 ? ' · andam de mal' : ''}</span></label></li>
            );
          })}
        </ul>
      </fieldset>
      <Escolha rotulo="Jeito" opcoes={jeitos.map(j => ({ id: j, rotulo: cap(MULT_DO_JEITO[j].nome) }))} valor={jeito} aoMudar={setJeito} />
      {m.id === 'saida' && <label className="marcar"><input type="checkbox" checked={rachar} onChange={e => setRachar(e.target.checked)} /> Cada um paga o seu (aproxima um pouco menos)</label>}
      <p className="encontros__total">{rachar ? 'Sua parte' : 'Total'}: <strong>{dinheiroCurto(total)}</strong></p>
      <span className="encontros__acoes">
        <BotaoAcao vida={vida} acao={acao} agir={agir} variante="principal">{cap(m.rotulo.replace(/^Chamar para /, 'Fazer o ').replace(/^Dar uma /, 'Dar a ').replace(/^Fazer um /, 'Fazer o ').replace(/^Organizar uma /, 'Fazer a '))}</BotaoAcao>
        <button type="button" className="botao botao--discreto" onClick={fechar}>Cancelar</button>
      </span>
    </div>
  );
}
