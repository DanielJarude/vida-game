/**
 * O momento de decidir. Abre por cima de tudo; depois da escolha, o
 * resultado aparece no mesmo lugar antes de a vida seguir.
 */

import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { Folha } from '../comum';
import { Retrato } from '../avatar/Retrato';
import { idadePessoa } from '../../motor/nucleo';
import { rotuloDe } from '../apresentar';

const TEMA_ROTULO: Record<string, string> = {
  infancia: 'Infância', familia: 'Família', amizade: 'Amizade', amor: 'Amor', escola: 'Escola', estudo: 'Estudos',
  trabalho: 'Trabalho', dinheiro: 'Dinheiro', casa: 'Casa', saude: 'Saúde', lugar: 'Lugar', lazer: 'Tempo livre',
  perda: 'Perda', filhos: 'Filhos', morte: 'Fim', escolha: 'Escolha', nascimento: 'Nascimento'
};

export function Momento({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const m = vida.momento!;
  const pessoas = Object.values(m.papeis).map(id => vida.pessoas[id]).filter(Boolean);
  return (
    <Folha rotulo={m.titulo} fechavel={false} papel>
      <div className="momento">
        <p className="momento__tema">{/^pol_/.test(m.situacaoId) ? 'Vida pública' : /^neg_/.test(m.situacaoId) ? 'O negócio' : /^esp_/.test(m.situacaoId) ? 'Esporte' : /^mil_/.test(m.situacaoId) ? 'A farda' : TEMA_ROTULO[m.tema] ?? ''}</p>
        <h2 className="momento__titulo">{m.titulo}</h2>
        {pessoas.length > 0 && (
          <div className="momento__pessoas">
            {pessoas.map(p => (
              <figure key={p.id} className="momento__pessoa">
                <Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.id} tamanho={56} especie={p.especie} rotulo={p.nome || 'Bebê'} />
                <figcaption>
                  <span>{p.nome || 'bebê'}</span>
                  {vida.vinculos[p.id] && <span className="momento__relacao">{rotuloDe(vida, p, vida.vinculos[p.id])}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        <p className="momento__texto">{m.texto}</p>
        <p className="momento__pergunta"><span className="momento__vez">Sua vez</span> <span>{m.situacaoId === 'trab_entrevista' ? 'O que você responde?' : m.situacaoId === 'esp_peneira' ? 'Como você joga?' : m.situacaoId === 'pol_eleicao' ? 'Como você faz?' : 'O que você faz?'}</span></p>
        <ul className="momento__opcoes">
          {m.opcoes.map(o => (
            <li key={o.id}>
              <button type="button" className="opcao" disabled={!!o.bloqueio} onClick={() => agir({ tipo: 'decidir', opcaoId: o.id })}>
                <span className="opcao__texto">{o.texto}</span>
                {o.bloqueio && <span className="opcao__bloqueio">{o.bloqueio}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Folha>
  );
}

export function Resultado({ titulo, texto, aoFechar, vida, pessoaId }: { titulo: string; texto: string; aoFechar: () => void; vida?: Vida; pessoaId?: string }) {
  const p = pessoaId && vida ? vida.pessoas[pessoaId] : undefined;
  return (
    <Folha rotulo={`Resultado: ${titulo}`} aoFechar={aoFechar} fechavel papel>
      <div className="momento momento--resultado">
        {p && vida && (
          <div className="momento__pessoas">
            <figure className="momento__pessoa">
              <Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.id} tamanho={64} rotulo={p.nome} />
              <figcaption><span>{p.nome}</span>{vida.vinculos[p.id] && <span className="momento__relacao">{rotuloDe(vida, p, vida.vinculos[p.id])}</span>}</figcaption>
            </figure>
          </div>
        )}
        <p className="momento__tema">{titulo}</p>
        <p className="momento__resultado">{texto}</p>
        <button type="button" className="botao botao--principal" onClick={aoFechar}>Continuar</button>
      </div>
    </Folha>
  );
}
