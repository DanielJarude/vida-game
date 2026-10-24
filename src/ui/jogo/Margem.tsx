/**
 * REWORK 10 · CRI-01 — À MARGEM E A JUSTIÇA, numa tela só (Caminhos · Outros caminhos). Antes, o envolvimento era uma
 * linha "Por fora" no fim do Trabalho e o processo, uma frase. Agora a trajetória se lê como as outras: há quanto
 * tempo, a confiança do meio, quem sabe o seu nome, o risco — e o que dá para fazer (pedir ajuda, negociar a saída,
 * largar). O processo é uma FICHA (as provas, a defesa, o acordo, a fiança, o julgamento), com as decisões que cabem
 * ao jogador; os antecedentes, uma folha com a reabilitação quando a lei do país deixa pedir.
 *
 * Nada aqui ensina coisa alguma: são as consequências, em palavras.
 */
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { BotaoAcao } from '../comum';
import { leituraDaMargem } from '../../motor/sistemas/margem';
import { leituraDoProcesso, perfilDaVida } from '../../motor/sistemas/tribunal';
import { situacaoNaJustica } from '../../motor/sistemas/justica';
import { anoDe } from '../../motor/tempo';
import { dinheiroCurto } from '../leituraMaterial';
import { PainelDoSubmundo } from './Submundo';
import { NOME_DO_RAMO, ramosAtivos } from '../../motor/sistemas/ramos';

const NOME: Record<string, string> = { pequenos: 'coisas erradas com a turma', patrimonial: 'receptação', fraude: 'fraude', mercado: 'comércio ilegal', grupo: 'grupo criminoso', corrupcao: 'corrupção', violencia: 'agressão' };
const DESFECHO: Record<string, string> = { socioeducativa: 'medida socioeducativa (não é ficha de adulto)', alternativa: 'condenação, pena alternativa', prisao: 'condenação, prisão', absolvicao: 'absolvição', acordo: 'acordo (sem condenação)' };

/** REWORK 10.5 · CRI-02: a situação no Submundo, numa linha (a entrada da página inicial e o subtítulo da divisão). */
export function situacaoNoSubmundo(v: Vida): string {
  const env = v.caminhos.envolvimento;
  if (v.justica?.prisao) return 'Cumprindo pena';
  if (v.justica?.foragido) return 'Foragido da Justiça';
  if (v.justica?.processo) return 'Respondendo a um processo';
  // REWORK 11.5: as frentes em que atua (os ramos), em vez de só a categoria.
  const frentes = ramosAtivos(env);
  if (env && env.parou === undefined && frentes.length) return `Por fora: ${frentes.map(r => NOME_DO_RAMO[r].toLowerCase()).join(' + ')} — ${(env.reputacao ?? 0) >= 60 ? 'de confiança no meio' : (env.reputacao ?? 0) >= 30 ? 'já confiam em você' : 'ainda gente de fora'}`;
  if (env && env.parou === undefined) return `Por fora: ${NOME[env.categoria] ?? 'um esquema'} — ${(env.reputacao ?? 0) >= 60 ? 'de confiança no meio' : (env.reputacao ?? 0) >= 30 ? 'já confiam em você' : 'ainda gente de fora'}`;
  if ((v.justica?.antecedentes.length ?? 0) > 0) return 'Fora disso, com antecedentes';
  if (env) return 'Fora disso — o passado ainda pode chegar';
  return 'Nenhum envolvimento';
}

/** Há o que mostrar? (quem nunca teve nada com isso não vê a tela). */
export const temMargem = (v: Vida) => !!v.caminhos.envolvimento || !!v.justica?.processo || (v.justica?.antecedentes.length ?? 0) > 0 || !!v.justica?.alternativa;

export function AMargem({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  if (!temMargem(vida)) return null;
  const m = leituraDaMargem(vida);
  const proc = leituraDoProcesso(vida);
  const j = vida.justica;
  const env = vida.caminhos.envolvimento;
  const ativo = !!env && env.parou === undefined;
  const situacao = situacaoNaJustica(vida);
  const perfil = perfilDaVida(vida);
  return (
    <section className="margem divisao__secao" aria-labelledby="titulo-margem">
      <h2 id="titulo-margem" className="secao-fio">À margem e a Justiça</h2>
      {m && (
        <div className="margem__caminho">
          <h3 className="margem__titulo">{m.titulo}</h3>
          <ul className="margem__linhas">{m.linhas.map((l, k) => <li key={k}>{l}</li>)}</ul>
          <div className="grupo-acoes">
            {ativo && <BotaoAcao vida={vida} acao={{ tipo: 'parar_por_fora' }} agir={agir} variante="principal" ocultarImpossivel>Largar isso de vez</BotaoAcao>}
            <BotaoAcao vida={vida} acao={{ tipo: 'margem', oque: 'procurar_ajuda' }} agir={agir} variante="secundario" ocultarImpossivel>Pedir ajuda para sair</BotaoAcao>
            {env && env.nivel >= 2 && <BotaoAcao vida={vida} acao={{ tipo: 'margem', oque: 'negociar_saida' }} agir={agir} variante="secundario" ocultarImpossivel>Negociar a saída com o grupo</BotaoAcao>}
          </div>
        </div>
      )}
      {/* REWORK 11.5 · SUB-17: as frentes, a gente e as organizações do caminho (o dossiê). */}
      {env && <PainelDoSubmundo vida={vida} agir={agir} />}
      {proc && (
        <div className="margem__processo papel papel--sem-dobra" aria-label="O processo">
          <p className="margem__cabeca"><span>Processo</span><span>{NOME[j!.processo!.categoria] ?? ''} · desde {anoDe(j!.processo!.tInicio)}</span></p>
          <ul className="margem__linhas">{proc.linhas.map((l, k) => <li key={k}>{l}</li>)}</ul>
          <div className="grupo-acoes">
            <BotaoAcao vida={vida} acao={{ tipo: 'margem', oque: 'advogado' }} agir={agir} variante="secundario" ocultarImpossivel>Contratar um advogado particular</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'margem', oque: 'assumir' }} agir={agir} variante="discreto" ocultarImpossivel>Assumir o que fez</BotaoAcao>
            {perfil.colaboracao && <BotaoAcao vida={vida} acao={{ tipo: 'margem', oque: 'cooperar' }} agir={agir} variante="discreto" ocultarImpossivel>Colaborar com a investigação</BotaoAcao>}
          </div>
        </div>
      )}
      {situacao && !proc && <p className="nota margem__situacao">{situacao}</p>}
      {j && j.antecedentes.length > 0 && (
        <div className="margem__ficha">
          <h3 className="margem__titulo">A ficha</h3>
          <ul className="margem__antecedentes">
            {j.antecedentes.map((a, k) => (
              <li key={k}><span className="margem__ano">{anoDe(a.t)}</span> {NOME[a.categoria] ?? a.categoria} — {DESFECHO[a.desfecho] ?? a.desfecho}{a.anos ? ` (${a.anos} ${a.anos === 1 ? 'ano' : 'anos'})` : ''}{a.multa ? ` · multa de ${dinheiroCurto(a.multa)}` : ''}{a.reabilitado !== undefined ? ` · reabilitado em ${anoDe(a.reabilitado)}` : ''}</li>
            ))}
          </ul>
          <BotaoAcao vida={vida} acao={{ tipo: 'margem', oque: 'reabilitacao' }} agir={agir} variante="secundario" ocultarImpossivel>Pedir a reabilitação</BotaoAcao>
          <p className="nota">A reabilitação, aqui, pode ser pedida {perfil.reabilitacaoAnos} anos depois do fim da pena, sem nada novo.</p>
        </div>
      )}
    </section>
  );
}
