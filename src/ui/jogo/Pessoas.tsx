/** Pessoas: quem faz parte da sua história, e o que dá para fazer com cada uma. */

import { useState } from 'react';
import type { Atracao, Pessoa, Vida, Vinculo } from '../../motor/tipos';
import type { Acao, InteracaoPessoa } from '../../motor/acoes';
import { LIMITE_INTERACOES } from '../../motor/acoes';
import { idade, idadePessoa, jeitoDe, parceiro } from '../../motor/nucleo';
import { nomeLugar } from '../../motor/dados/lugares';
import { flex } from '../../motor/texto';
import { anoDe } from '../../motor/tempo';
import { gestacaoEmCurso } from '../../motor/sistemas/familia';
import { descricaoOrigem } from '../../motor/sistemas/social';
import { gruposDePessoas, palavraProximidade, rotuloDe } from '../apresentar';
import { BotaoAcao, Escolha, Folha, Secao, Vazio } from '../comum';
import { Retrato } from '../avatar/Retrato';

interface Props { vida: Vida; agir: (a: Acao) => boolean }

export function Pessoas({ vida, agir }: Props) {
  const [aberta, setAberta] = useState<string | null>(null);
  const grupos = gruposDePessoas(vida);
  const usadas = vida.anoAtual.acoes.filter(a => a.startsWith('pessoa:')).length;
  const pessoa = aberta ? vida.pessoas[aberta] : null;
  return (
    <div className="pessoas">
      <p className="dica">
        Neste ano ainda há tempo para {Math.max(0, LIMITE_INTERACOES - usadas)} {LIMITE_INTERACOES - usadas === 1 ? 'momento' : 'momentos'} com as pessoas.
        Quem convive com você todo dia continua perto sem esforço; quem está longe, esfria.
      </p>
      <Familia vida={vida} agir={agir} />
      {grupos.map(g => (
        <Secao key={g.titulo} titulo={g.titulo} recolhivel aberta={!g.recolhido}>
          <ul className="lista-pessoas">
            {g.pessoas.map(({ p, vin }) => (
              <li key={p.id}>
                <button type="button" className={`pessoa${p.vivo ? '' : ' pessoa--falecida'}`} onClick={() => setAberta(p.id)}>
                  <Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.id} tamanho={44} especie={p.especie} rotulo={p.nome} falecido={!p.vivo} />
                  <span className="pessoa__nome">{p.nome || 'Bebê'}</span>
                  <span className="pessoa__rotulo">{rotuloDe(vida, p, vin)}{p.vivo ? ` · ${idadePessoa(vida, p)}` : ` · †${p.tMorte ? anoDe(p.tMorte) : ''}`}</span>
                  {p.vivo && <span className={`pessoa__prox${vin.tensao >= 55 ? ' pessoa__prox--tensa' : ''}`}>{palavraProximidade(p, vin)}</span>}
                </button>
              </li>
            ))}
          </ul>
        </Secao>
      ))}
      {grupos.length === 0 && <Vazio>Ninguém por perto ainda.</Vazio>}
      {pessoa && <FichaPessoa vida={vida} p={pessoa} vin={vida.vinculos[pessoa.id]} agir={agir} aoFechar={() => setAberta(null)} />}
    </div>
  );
}

/** Orientação e planejamento familiar — só aparecem quando fazem sentido. */
function Familia({ vida, agir }: Props) {
  const i = idade(vida);
  const par = parceiro(vida);
  const gest = gestacaoEmCurso(vida);
  const opcoesAtracao: { id: Atracao | 'aberto'; rotulo: string }[] = [
    { id: 'aberto', rotulo: 'Ainda não sei' }, { id: 'mulheres', rotulo: 'Mulheres' }, { id: 'homens', rotulo: 'Homens' }, { id: 'ambos', rotulo: 'Qualquer gênero' }
  ];
  if (i < 13) return null;
  return (
    <Secao titulo="Você" recolhivel aberta={!!par || !!gest}>
      <div className="campo">
        <span className="campo__rotulo">Por quem você se interessa</span>
        <Escolha rotulo="Por quem você se interessa" opcoes={opcoesAtracao} valor={vida.eu.atracao ?? 'aberto'}
          aoMudar={valor => agir({ tipo: 'atracao', valor: valor === 'aberto' ? undefined : valor })} />
      </div>
      {gest && (
        <p className="nota">
          {gest.gestanteId === 'eu' ? 'Você está esperando um bebê' : `${vida.pessoas[gest.gestanteId]?.nome ?? ''} está esperando um bebê`}
          {gest.descoberta ? ` — o parto é previsto para ${anoDe(gest.tParto)}.` : '.'}
        </p>
      )}
      {par && i >= 18 && !gest && (
        <div className="grupo-acoes">
          <p className="nota">Filhos: {par.vin.romance?.planoFilhos === 'tentando' ? 'vocês estão tentando.' : par.vin.romance?.planoFilhos === 'sem_planejar' ? 'sem planejar.' : 'vocês estão evitando.'}</p>
          <BotaoAcao vida={vida} acao={{ tipo: 'filhos', plano: 'tentando' }} agir={agir}>Conversar sobre ter um filho</BotaoAcao>
          {par.vin.romance?.planoFilhos === 'tentando' && <BotaoAcao vida={vida} acao={{ tipo: 'filhos', plano: 'evitando' }} agir={agir} variante="discreto">Voltar a evitar</BotaoAcao>}
        </div>
      )}
      {i >= 18 && <BotaoAcao vida={vida} acao={{ tipo: 'adotar' }} agir={agir} variante="discreto" ocultarImpossivel>Entrar com um pedido de adoção</BotaoAcao>}
    </Secao>
  );
}

const INTERACOES: { id: InteracaoPessoa; rotulo: (p: Pessoa, vin: Vinculo) => string; quando: (vida: Vida, p: Pessoa, vin: Vinculo) => boolean; variante?: 'principal' | 'secundario' | 'discreto' | 'perigo'; chance?: boolean }[] = [
  { id: 'tempo', rotulo: p => (p.especie ? 'Passear e brincar' : 'Passar um tempo junto'), quando: () => true, variante: 'principal' },
  { id: 'conversar', rotulo: (_p, vin) => (vin.tensao >= 40 ? 'Conversar e tentar acertar as coisas' : 'Ter uma conversa de verdade'), quando: (_v, p) => !p.especie },
  { id: 'ajudar', rotulo: () => 'Ajudar com dinheiro', quando: (v, p) => !p.especie && idade(v) >= 14 },
  { id: 'reaproximar', rotulo: () => 'Procurar depois de tanto tempo', quando: (_v, _p, vin) => vin.estagio === 'afastado' },
  { id: 'convidar', rotulo: p => `Chamar ${p.nome} para sair`, quando: (_v, p, vin) => !p.especie && !vin.parentesco && (!vin.romance || vin.romance.estagio === 'interesse' || vin.romance.estagio === 'ex'), chance: true },
  { id: 'pedir_namoro', rotulo: () => 'Pedir em namoro', quando: (_v, _p, vin) => vin.romance?.estagio === 'saindo' },
  { id: 'morar_junto', rotulo: () => 'Propor morar junto', quando: (_v, _p, vin) => vin.romance?.estagio === 'namoro' },
  { id: 'pedir_casamento', rotulo: () => 'Pedir em casamento', quando: (_v, _p, vin) => !!vin.romance && ['namoro', 'morando_junto'].includes(vin.romance.estagio) },
  { id: 'terminar', rotulo: (_p, vin) => (vin.romance?.estagio === 'casamento' ? 'Pedir o divórcio' : 'Terminar'), quando: (_v, _p, vin) => !!vin.romance && ['saindo', 'namoro', 'morando_junto', 'casamento'].includes(vin.romance.estagio), variante: 'perigo' }
];

function FichaPessoa({ vida, p, vin, agir, aoFechar }: { vida: Vida; p: Pessoa; vin: Vinculo; agir: (a: Acao) => boolean; aoFechar: () => void }) {
  const ip = idadePessoa(vida, p);
  return (
    <Folha rotulo={p.nome || 'Bebê'} aoFechar={aoFechar}>
      <div className="ficha">
        <div className="ficha__topo">
          <Retrato visual={p.visual} genero={p.genero} idade={ip} semente={p.id} tamanho={96} especie={p.especie} rotulo={p.nome} falecido={!p.vivo} />
          <div>
            <h2 className="ficha__nome">{p.nome || 'Bebê'} {!p.especie && <span className="ficha__sobrenome">{p.sobrenome}</span>}</h2>
            <p className="ficha__rotulo">{rotuloDe(vida, p, vin)}</p>
            <p className="ficha__meta">
              {p.vivo ? `${ip} ${ip === 1 ? 'ano' : 'anos'}` : `morreu em ${p.tMorte ? anoDe(p.tMorte) : '—'}${p.causaMorte ? ` (${p.causaMorte})` : ''}`}
              {!p.especie && p.vivo && p.ocupacao ? ` · ${p.ocupacao}` : ''}
              {p.vivo && !p.especie && p.municipioId !== vida.moradia.municipioId ? ` · mora em ${nomeLugar(p.municipioId)}` : ''}
            </p>
          </div>
        </div>
        {!p.especie && p.vivo && ip >= 4 && <p className="ficha__jeito">{flex(p.genero, 'Ele', 'Ela', 'Elu')} é {jeitoDe(p)}.</p>}
        {!vin.parentesco && !p.especie && <p className="ficha__origem">Vocês se conheceram {descricaoOrigem(vida, vin)}, em {anoDe(vin.tInicio)}.</p>}
        {p.vivo && <p className="ficha__prox">{palavraProximidade(p, vin)[0].toUpperCase() + palavraProximidade(p, vin).slice(1)}{vin.convivio.length > 0 ? ' · convivem no dia a dia' : ''}.</p>}
        {vin.historia.length > 0 && (
          <div className="ficha__historia">
            <h3>O que viveram juntos</h3>
            <ul>{vin.historia.map((h, k) => <li key={k}><span className="ficha__ano">{anoDe(h.t)}</span> {h.texto}</li>)}</ul>
          </div>
        )}
        {p.vivo && (
          <div className="grupo-acoes">
            {INTERACOES.filter(x => x.quando(vida, p, vin)).map(x => (
              <BotaoAcao key={x.id} vida={vida} acao={{ tipo: 'pessoa', pessoaId: p.id, interacao: x.id }} agir={agir} variante={x.variante} mostrarChance={x.chance}
                ocultarImpossivel={x.id === 'convidar'}>
                {x.rotulo(p, vin)}
              </BotaoAcao>
            ))}
          </div>
        )}
      </div>
    </Folha>
  );
}
