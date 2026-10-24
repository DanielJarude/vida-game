/**
 * REWORK 10.6 — UMA VIDA AO SEU ALCANCE: as peças que ligam o que o jogo já sabe ao lugar onde o jogador está.
 *
 *   DetalheDaOportunidade   o convite anunciado abre o próprio convite (quem chamou, o prazo, o que pede, o que muda,
 *                           aceitar, deixar passar, decidir depois) — antes, o painel levava a uma aba genérica
 *   PedidoDeCompra          a criança diante do que não pode pagar: o preço, o cofrinho, o que falta — e pedir aos
 *                           responsáveis (comprar inteiro ou completar), escolhendo a quem, sem perder o produto
 *   TratamentoEmCurso       parar um tratamento com o risco dito antes; retomar, procurando atendimento
 */

import { useState } from 'react';
import type { Condicao, Oportunidade, Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { disponibilidade } from '../../motor/acoes';
import { podeTentar } from '../../motor/plausibilidade';
import { anoDe, mesDe, MESES } from '../../motor/tempo';
import { idadePessoa } from '../../motor/nucleo';
import { ocupacaoOuNula } from '../../motor/dados/ocupacoes';
import { nomeOcupacao } from '../../motor/sistemas/trabalho';
import { modeloRotina } from '../../motor/sistemas/rotinas';
import { analisarEntrada } from '../../motor/sistemas/compromissos';
import { oportunidadesAbertas } from '../../motor/sistemas/mercados';
import { aQuemPedir, dependeDosResponsaveis, situacaoDaCompra } from '../../motor/sistemas/pedidosDaCrianca';
import { riscoDeParar } from '../../motor/sistemas/saude';
import { BotaoAcao, Folha, Linha } from '../comum';
import { dinheiroCurto } from '../apresentar';
import { Retrato } from '../avatar/Retrato';

const TIPO_EM_PALAVRAS: Partial<Record<Oportunidade['tipo'], string>> = {
  vaga: 'Uma vaga', indicacao: 'Uma indicação', aprendiz: 'Aprendizagem', estagio: 'Estágio', temporario: 'Trabalho temporário', peneira: 'Peneira',
  seletiva: 'Seletiva', banda: 'Uma banda', grupo: 'Um grupo', clientela: 'Clientes', convite: 'Um convite', retomar: 'Voltar a fazer', bolsa: 'Uma bolsa',
  selecao_tecnico: 'Seleção do técnico', proposta: 'Uma proposta', edital_cultura: 'Edital de cultura', reinsercao: 'Recomeço', atualizacao: 'Atualização',
  funcao: 'Uma função nova', iniciacao: 'Um projeto'
};

/** O que aceitar muda, em palavras — lido do motor (o trabalho e o salário, a atividade, o conflito com o que já existe). */
function oQueMuda(vida: Vida, o: Oportunidade): string[] {
  const out: string[] = [];
  const oc = o.ocupacaoId ? ocupacaoOuNula(o.ocupacaoId) : undefined;
  if (oc) {
    out.push(`Trabalho: ${nomeOcupacao(vida, oc)}${oc.carga === 'parcial' ? ', meio período' : ''}.`);
    if (['aprendiz', 'estagio', 'indicacao', 'vaga', 'proposta', 'reinsercao'].includes(o.tipo)) out.push('Aceitar leva à entrevista: a vaga ainda é decidida lá.');
    const c = analisarEntrada(vida, { tipo: 'emprego', ocupacaoId: oc.id, via: 'oportunidade' });
    for (const x of c) out.push(`${x.motivo}: ${x.impede ? 'não dá agora' : 'ao aceitar, a vida pergunta o que fazer'}.`);
  }
  if (o.atividade) { const m = modeloRotina(o.atividade); out.push(m ? `Uma atividade nova na semana: ${m.nome.toLowerCase()} (entra na agenda).` : 'Uma atividade nova na semana.'); }
  if (o.tipo === 'peneira' || o.tipo === 'seletiva') out.push('Um teste: passar abre a base (ou a equipe) — e os treinos tomam a semana.');
  if (o.tipo === 'bolsa' && !oc) out.push('Uma bolsa de estudos: o curso fica mais barato (ou de graça).');
  if (o.bonus) out.push('Quem chama abre a porta: a chance é maior do que pela via comum.');
  return out;
}

/**
 * REWORK 10.6 · UX-23 — O CONVITE, ABERTO. Quem chamou (com o rosto), o que é, o prazo, o que pede (o motor diz se dá
 * e, se não, por quê), o que muda — e as respostas: aceitar, deixar passar, decidir depois. O convite que já fechou
 * não se aceita: diz-se que fechou.
 */
export function DetalheDaOportunidade({ vida, id, agir, aoFechar, abrirPessoa }: { vida: Vida; id: string; agir: (a: Acao) => boolean; aoFechar: () => void; abrirPessoa?: (id: string) => void }) {
  const aberta = oportunidadesAbertas(vida).find(x => x.id === id);
  const o = aberta ?? vida.caminhos.oportunidades.find(x => x.id === id);
  if (!o || !aberta) {
    return (
      <Folha titulo="Convite" rotulo="Convite encerrado" aoFechar={aoFechar}>
        <p className="nota-grande">{o ? `Esse convite fechou em ${anoDe(o.tFim)}: já não dá para aceitar.` : 'Esse convite já foi respondido (ou fechou): não está mais entre as portas abertas.'}</p>
        <div className="grupo-acoes"><button type="button" className="botao botao--secundario" onClick={aoFechar}>Voltar</button></div>
      </Folha>
    );
  }
  const quem = o.pessoaId ? vida.pessoas[o.pessoaId] : undefined;
  const d = disponibilidade(vida, { tipo: 'oportunidade', id: o.id, aceitar: true });
  const meses = Math.max(0, o.tFim - vida.t);
  const muda = oQueMuda(vida, o);
  return (
    <Folha titulo={TIPO_EM_PALAVRAS[o.tipo] ?? 'Uma porta aberta'} rotulo={`Convite: ${o.titulo}`} aoFechar={aoFechar} papel>
      <article className="detalhe-convite" data-convite={o.id}>
        {quem && (
          <div className="detalhe-convite__quem">
            <Retrato visual={quem.visual} genero={quem.genero} idade={idadePessoa(vida, quem)} semente={quem.pet?.semente ?? quem.id} tamanho={48} rotulo={quem.nome} especie={quem.especie} porte={quem.pet?.porte} />
            <span><strong>{quem.nome}</strong>{vida.vinculos[quem.id] ? ' chamou você' : ''}{abrirPessoa && vida.vinculos[quem.id] && <> · <button type="button" className="link" onClick={() => { aoFechar(); abrirPessoa(quem.id); }}>ver a ficha</button></>}</span>
          </div>
        )}
        <h2 className="detalhe-convite__titulo">{o.titulo}</h2>
        <p>{o.texto}</p>
        <Linha rotulo="Prazo" valor={`até ${MESES[mesDe(o.tFim)]} de ${anoDe(o.tFim)}${meses <= 12 ? ` · ${meses <= 1 ? 'vence agora' : `faltam uns ${meses} meses`}` : ''}`} />
        <Linha rotulo="O que pede" valor={podeTentar(d) ? (d.motivo ?? 'Você atende ao que o convite pede.') : (d.motivo ?? 'Agora não dá.')} tom={podeTentar(d) ? 'bom' : 'ruim'} />
        {muda.length > 0 && (
          <div className="detalhe-convite__muda">
            <p className="rotulo-pequeno">O que muda, se aceitar</p>
            <ul>{muda.map((x, k) => <li key={k}>{x}</li>)}</ul>
          </div>
        )}
        <div className="grupo-acoes grupo-acoes--linha">
          <BotaoAcao vida={vida} acao={{ tipo: 'oportunidade', id: o.id, aceitar: true }} agir={agir} variante="principal" aoAgir={aoFechar}>Aceitar</BotaoAcao>
          <BotaoAcao vida={vida} acao={{ tipo: 'oportunidade', id: o.id, aceitar: false }} agir={agir} variante="discreto" aoAgir={aoFechar}>Deixar passar</BotaoAcao>
          <button type="button" className="botao botao--secundario" onClick={aoFechar}>Decidir depois</button>
        </div>
      </article>
    </Folha>
  );
}

/**
 * REWORK 10.6 · INF-02 — a criança diante do que custa mais do que tem: o preço, o que há no cofrinho, o que falta — e
 * as saídas de verdade: pedir para comprar, pedir ajuda para completar (quando há algo guardado), escolher a quem pedir
 * (quando há mais de um adulto) ou guardar e voltar depois. O pedido leva ESTE produto: ninguém procura de novo.
 */
export function PedidoDeCompra({ vida, coisaId, agir }: { vida: Vida; coisaId: string; agir: (a: Acao) => boolean }) {
  const s = situacaoDaCompra(vida, coisaId);
  const [quem, setQuem] = useState<string | undefined>(s.quem[0]?.id);
  if (!dependeDosResponsaveis(vida) || !s.quem.length) return null;
  const pedir = disponibilidade(vida, { tipo: 'pedir_compra', coisaId, responsavelId: quem });
  if (pedir.grau === 'impossivel') return null;
  const nome = s.quem.find(x => x.id === quem)?.nome ?? s.quem[0].nome;
  return (
    <div className="pedido-compra" data-pedido={coisaId}>
      <dl className="pedido-compra__conta">
        <div><dt>Preço</dt><dd>{dinheiroCurto(s.preco)}</dd></div>
        <div><dt>No cofrinho</dt><dd>{dinheiroCurto(s.tem)}</dd></div>
        {s.falta > 0 && <div><dt>Falta</dt><dd>{dinheiroCurto(s.falta)}</dd></div>}
      </dl>
      {s.quem.length > 1 && (
        <label className="pedido-compra__quem">Pedir a
          <select value={quem} onChange={e => setQuem(e.target.value)}>
            {s.quem.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}
          </select>
        </label>
      )}
      <div className="grupo-acoes grupo-acoes--linha">
        <BotaoAcao vida={vida} acao={{ tipo: 'pedir_compra', coisaId, responsavelId: quem }} agir={agir} variante="secundario">{`Pedir a ${nome} para comprar`}</BotaoAcao>
        {s.tem > 0 && s.falta > 0 && <BotaoAcao vida={vida} acao={{ tipo: 'pedir_compra', coisaId, completar: true, responsavelId: quem }} agir={agir} variante="discreto" ocultarBloqueado>{`Pedir ajuda para completar ${dinheiroCurto(s.falta)}`}</BotaoAcao>}
      </div>
      {s.falta > 0 && <p className="nota">Ou guardar e voltar depois: a mesada, as tarefas pagas e os presentes enchem o cofrinho (Vida · Dinheiro).</p>}
    </div>
  );
}

/** REWORK 11 (pendência 10.6 · INF-04) — a bicicleta da loja de veículos: o preço e o pedido a quem cuida de você. */
export function PedidoDeVeiculo({ vida, modeloId, preco, agir }: { vida: Vida; modeloId: string; preco: number; agir: (a: Acao) => boolean }) {
  const quemPode = aQuemPedir(vida).map(x => ({ id: x.p.id, nome: x.p.nome }));
  const [quem, setQuem] = useState<string | undefined>(quemPode[0]?.id);
  if (!dependeDosResponsaveis(vida) || !quemPode.length) return null;
  const pedir = disponibilidade(vida, { tipo: 'pedir_veiculo', modeloId, responsavelId: quem });
  if (pedir.grau === 'impossivel') return null;
  const nome = quemPode.find(x => x.id === quem)?.nome ?? quemPode[0].nome;
  return (
    <div className="pedido-compra" data-pedido={modeloId}>
      <dl className="pedido-compra__conta">
        <div><dt>Preço</dt><dd>{dinheiroCurto(preco)}</dd></div>
      </dl>
      {quemPode.length > 1 && (
        <label className="pedido-compra__quem">Pedir a
          <select value={quem} onChange={e => setQuem(e.target.value)}>
            {quemPode.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}
          </select>
        </label>
      )}
      <div className="grupo-acoes grupo-acoes--linha">
        <BotaoAcao vida={vida} acao={{ tipo: 'pedir_veiculo', modeloId, responsavelId: quem }} agir={agir} variante="principal">{`Pedir a ${nome}`}</BotaoAcao>
      </div>
    </div>
  );
}

/** REWORK 10.6 · P4 — o tratamento em curso: parar (com o risco dito antes, e confirmado) ou, parado, retomar. */
export function TratamentoEmCurso({ vida, c, agir }: { vida: Vida; c: Condicao; agir: (a: Acao) => boolean }) {
  const [confirmar, setConfirmar] = useState(false);
  if (!c.cronica || c.lesao || c.diagnosticada === false) return null;
  if (!c.tratando) {
    if (!c.abandono) return null;
    return (
      <div className="tratamento tratamento--parado" data-tratamento={c.id}>
        <p className="nota">{c.nome.charAt(0).toUpperCase() + c.nome.slice(1)}: tratamento parado desde {anoDe(c.abandono.t)}. Sem ele, o corpo pode cobrar: {riscoDeParar(vida, c).split('. ')[0].toLowerCase()}.</p>
        <BotaoAcao vida={vida} acao={{ tipo: 'cuidar', cuidado: 'consulta' }} agir={agir} variante="secundario">Retomar o tratamento (procurar atendimento)</BotaoAcao>
      </div>
    );
  }
  const pode = disponibilidade(vida, { tipo: 'parar_tratamento', condicaoId: c.id });
  if (pode.grau === 'impossivel') return null;
  return (
    <div className="tratamento" data-tratamento={c.id}>
      {!confirmar
        ? <button type="button" className="botao botao--discreto" onClick={() => setConfirmar(true)} disabled={!podeTentar(pode)}>{`Parar o tratamento (${c.nome})…`}</button>
        : (
          <div className="tratamento__confirmar" role="group" aria-label={`Parar o tratamento de ${c.nome}`}>
            <p className="nota nota--atencao">{riscoDeParar(vida, c)}</p>
            <div className="grupo-acoes grupo-acoes--linha">
              <BotaoAcao vida={vida} acao={{ tipo: 'parar_tratamento', condicaoId: c.id }} agir={agir} variante="perigo" aoAgir={() => setConfirmar(false)}>Parar mesmo assim</BotaoAcao>
              <button type="button" className="botao botao--secundario" onClick={() => setConfirmar(false)}>Continuar tratando</button>
            </div>
          </div>
        )}
      {!podeTentar(pode) && pode.motivo && <p className="acao__motivo">{pode.motivo}</p>}
    </div>
  );
}
