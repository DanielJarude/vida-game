/**
 * VIDA 19 · O haras que cria — os cavalos de corrida com a linhagem, e as decisões de reprodução (dentro de Vida · Campo).
 */
import { useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import type { PropriedadeRural18 } from '../../../motor/v18/rural/fazenda18';
import { GARANHOES19, potencial19, valorDoCavalo19 } from '../../../motor/v19/haras/haras19';
import { anoDe } from '../../../motor/tempo';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../apresentar';
import './haras19.css';

export function Haras19({ vida, agir, p }: { vida: Vida; agir: (a: Acao) => boolean; p: PropriedadeRural18 }) {
  const cavalos = p.cavalos ?? [];
  const [garanhao, setGaranhao] = useState<string>('fora:regional');
  const ano = anoDe(vida.t);
  const machos = cavalos.filter(c => c.sexo === 'macho' && ano - c.nasc >= 3);
  const opcoes = [...GARANHOES19.map(g => ({ id: `fora:${g.id}`, rotulo: `${g.nome} (${g.origem}) · monta ${dinheiroCurto(g.monta)}`, velocidade: g.velocidade, fundo: g.fundo })), ...machos.map(c => ({ id: c.id, rotulo: `${c.nome} (da casa)`, velocidade: c.velocidade, fundo: c.fundo }))];
  const g = opcoes.find(o => o.id === garanhao) ?? opcoes[0];
  const h = (oque: Extract<Acao, { tipo: 'haras19' }>['oque']): Acao => ({ tipo: 'haras19', oque });
  if (!cavalos.length) return null;
  return (
    <div className="haras19">
      <ul className="campo18__cavalos" aria-label="Cavalos de corrida">
        {cavalos.map(c => {
          const i = ano - c.nasc;
          const estado = c.prenhe ? `prenhe de ${c.prenhe.garanhao} · potro em ${c.prenhe.ano}` : c.reproducao ? (c.sexo === 'femea' ? 'matriz' : 'reprodutor') : i < 2 ? 'potro em desenvolvimento' : c.aposentado ? 'aposentado' : 'em atividade';
          return (
            <li key={c.id} className="haras19__cavalo">
              <div><strong>{c.nome}</strong> <span>{c.sexo === 'femea' ? 'égua' : 'cavalo'} · {i} {i === 1 ? 'ano' : 'anos'} · {estado}</span></div>
              <span className="haras19__ficha">velocidade {c.velocidade} · fundo {c.fundo} · {c.corridas} corridas, {c.vitorias} vitórias{c.pai ? ` · filho de ${c.pai} e ${c.mae}` : ''}</span>
              <div className="campo18__botoes">
                {c.sexo === 'femea' && i >= 3 && i <= 16 && !c.prenhe && <BotaoAcao vida={vida} agir={agir} acao={h({ op: 'cobrir', propriedade: p.id, egua: c.id, garanhao: g?.id ?? 'fora:regional' })}>Cobrir com {g ? g.rotulo.split(' (')[0] : 'garanhão'}</BotaoAcao>}
                {!c.reproducao && i >= 3 && <BotaoAcao vida={vida} agir={agir} acao={h({ op: 'reproducao', propriedade: p.id, cavalo: c.id })}>{c.sexo === 'femea' ? 'Virar matriz' : 'Virar reprodutor'}</BotaoAcao>}
                <BotaoAcao vida={vida} agir={agir} acao={h({ op: 'vender', propriedade: p.id, cavalo: c.id })}>Vender · {dinheiroCurto(valorDoCavalo19(vida, c))}</BotaoAcao>
              </div>
            </li>
          );
        })}
      </ul>
      {cavalos.some(c => c.sexo === 'femea') && opcoes.length > 0 && (
        <label className="campo18__campo haras19__garanhao">Garanhão para a cobertura
          <select value={g?.id} onChange={e => setGaranhao(e.target.value)}>
            {opcoes.map(o => <option key={o.id} value={o.id}>{o.rotulo}</option>)}
          </select>
        </label>
      )}
      {g && cavalos.some(c => c.sexo === 'femea') && (
        <p className="nota">Com {g.rotulo.split(' (')[0]}, o potro de uma égua média tende a velocidade {potencial19(g, { velocidade: 55, fundo: 55 }).velocidade} e fundo {potencial19(g, { velocidade: 55, fundo: 55 }).fundo} — a genética puxa, o acaso decide. Gestação de onze meses; a égua prenhe não corre.</p>
      )}
      <p className="nota">Correm no turfe: Vida · Apostas · Turfe → inscrever um cavalo da casa.</p>
    </div>
  );
}
