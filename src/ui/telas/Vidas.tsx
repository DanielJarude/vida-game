import type { ControleVida } from '../useVida';
import { formatarDinheiroCurto } from '../../motor/mundo/moeda';

// PWA: as estatísticas vêm do controle (lidas pela persistência — IndexedDB ou localStorage), não direto do localStorage.
export function Vidas({ c }: { c: ControleVida }) {
  const e = c.estatisticas ?? { vidasJogadas: 0, totalAnosVividos: 0, maiorIdade: 0, maiorPatrimonio: 0, historico: [] };
  return (
    <div className="vidas">
      <h1>Vidas passadas</h1>
      <p className="nota">{e.vidasJogadas} {e.vidasJogadas === 1 ? 'vida' : 'vidas'} · {e.totalAnosVividos} anos vividos · a mais longa chegou aos {e.maiorIdade}.</p>
      <ul className="vidas__lista">
        {e.historico.map(v => (
          <li key={v.id + v.ano}>
            <strong>{v.nome}</strong>
            <span>{v.idadeMorte} anos · {v.lugar}{v.profissao && v.profissao !== '—' ? ` · ${v.profissao}` : ''} · {v.causa} · deixou {formatarDinheiroCurto(v.patrimonio, v.pais ?? 'BR')}</span>
          </li>
        ))}
      </ul>
      <button type="button" className="botao botao--secundario" onClick={() => c.setTela('inicio')}>Voltar</button>
    </div>
  );
}
