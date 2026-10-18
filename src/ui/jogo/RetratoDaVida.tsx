/**
 * REWORK 9.5 · UX-06 — O ALTO DA HISTÓRIA: um retrato contextual, não quatro medidores.
 *
 * O playtest viu, no topo da História, quatro cartões iguais (bem-estar, saúde, corpo, aprendizado): linguagem de painel,
 * repetida em Você, e que não dizia quem é a pessoa nem o momento dela. Agora o alto conta a vida em poucas linhas, todas
 * de dados do motor: o rosto, o nome, a idade e a fase; onde mora e com quem; o que ocupa a vida; o momento (a mesma
 * frase de Você); o que mudou de situação no último ano (o trabalho, o curso, o diploma); as pessoas que mais importam (a um toque). O que é
 * crítico — a saúde frágil, a cabeça no limite — atravessa como aviso, com o caminho para Você. O detalhe de corpo,
 * cabeça e habilidades mora em Você: "História conta a vida; Você explica o personagem".
 */

import type { Vida } from '../../motor/tipos';
import { idade, idadePessoa, vinculosVivos } from '../../motor/nucleo';
import { importancia } from '../../motor/sistemas/vinculos';
import { Retrato } from '../avatar/Retrato';
import { expressaoDe, momentoAtual, sinaisDaVida } from '../estadoPessoal';
import { faseDaVida, ocupacaoAtual, ondeMora } from '../apresentar';
import { etiqueta, lutoVisivel, situacaoAfetiva } from '../leitura';
import { nomeLugar } from '../../motor/dados/lugares';
import { ocupacaoOuNula } from '../../motor/dados/ocupacoes';
import { nomeOcupacao } from '../../motor/sistemas/trabalho';
import { nomeDaMatricula } from '../../motor/sistemas/escola';
import { dinheiroCurto } from '../apresentar';
import type { Aba } from '../navegacao';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * O que mudou de SITUAÇÃO no último ano (não os acontecimentos — esses a Linha da Vida conta logo abaixo): as duas últimas
 * fotografias do ano (`evolucao`) comparadas — o trabalho que começou, acabou ou mudou, o salário, o curso, o diploma, o
 * nível no esporte. Nada que o motor não tenha registrado.
 */
export function mudancasRecentes(v: Vida): string[] {
  const ev = v.evolucao ?? [];
  const cur = ev[ev.length - 1];
  if (!cur || cur.t < v.t - 12) return [];
  const prev = ev[ev.length - 2];
  const out: string[] = [];
  const nome = (id: string) => { const oc = ocupacaoOuNula(id); return oc ? nomeOcupacao(v, oc) : 'o trabalho'; };
  const a = prev?.trabalho, b = cur.trabalho;
  if (prev && !a && b) out.push(`Começou a trabalhar: ${nome(b.ocupacaoId)}.`);
  else if (a && !b) out.push(`Deixou o trabalho de ${nome(a.ocupacaoId).toLowerCase()}.`);
  else if (a && b && a.ocupacaoId !== b.ocupacaoId) out.push(`Mudou de trabalho: agora, ${nome(b.ocupacaoId).toLowerCase()}.`);
  else if (a && b && b.salario >= a.salario * 1.1) out.push(`O salário subiu: de ${dinheiroCurto(a.salario)} para ${dinheiroCurto(b.salario)}.`);
  if (prev && prev.curso === undefined && cur.curso !== undefined && v.educacao.matricula) out.push(`Começou ${nomeDaMatricula(v, v.educacao.matricula)}.`);
  for (const c of v.educacao.concluidos) if (c.tFim > v.t - 12) out.push(`Formou-se: ${c.nome}.`);
  if (prev?.esporte && cur.esporte && cur.esporte.nivel > prev.esporte.nivel) out.push('Subiu de nível no esporte.');
  return out.slice(0, 3);
}

/** Até três pessoas que mais importam agora (vivas, com nome), pela importância que o motor dá ao vínculo. */
export function pessoasQueImportam(v: Vida) {
  return vinculosVivos(v)
    .filter(x => x.p.nome && !x.p.especie && x.vin.proximidade >= 40)
    .sort((a, b) => importancia(v, b.p, b.vin) - importancia(v, a.p, a.vin))
    .slice(0, 3);
}

export function RetratoDaVida({ vida, irPara, abrirPessoa }: { vida: Vida; irPara: (a: Aba) => void; abrirPessoa: (id: string) => void }) {
  const i = idade(vida);
  const afeto = situacaoAfetiva(vida);
  const luto = lutoVisivel(vida);
  const mudou = i >= 1 ? mudancasRecentes(vida) : [];
  const gente = i >= 3 ? pessoasQueImportam(vida) : [];
  // O que é crítico atravessa: a dimensão no fundo da escala (frágil, no limite), com o caminho para Você.
  const criticos = sinaisDaVida(vida).filter(s => s.nivel <= 1 && (s.id === 'saude' || s.id === 'cabeca' || s.id === 'humor'));
  return (
    <header className="hoje hoje--retrato">
      <button type="button" className="hoje__rosto" onClick={() => irPara('voce')} aria-label="Ver como você está">
        <Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? 'eu'} tamanho={72} rotulo={`${vida.eu.nome} aos ${i}`} expressao={expressaoDe(vida)} />
      </button>
      <div className="hoje__texto">
        <p className="folio__kicker"><span className="folio__area">História</span> · {i} {i === 1 ? 'ano' : 'anos'} · {faseDaVida(i)}</p>
        <h1 className="hoje__nome">{vida.eu.nome} <span>{vida.eu.sobrenome}</span></h1>
        <p className="hoje__frase">{momentoAtual(vida)}</p>
      </div>
      <section className="retrato-vida" aria-label="A vida agora">
        <dl className="retrato-vida__ficha">
          <div><dt>Onde</dt><dd>{nomeLugar(vida.moradia.municipioId)} · {ondeMora(vida)}</dd></div>
          <div><dt>Agora</dt><dd>{cap(ocupacaoAtual(vida))}</dd></div>
          {(afeto || luto) && <div><dt>No coração</dt><dd>{[afeto, luto].filter(Boolean).join(' · ')}</dd></div>}
        </dl>
        {criticos.length > 0 && (
          <p className="retrato-vida__alerta" role="status">
            <span aria-hidden>! </span>{criticos.map(s => `${s.nome}: ${s.palavra}`).join(' · ')}.{' '}
            <button type="button" className="link" onClick={() => irPara('voce')}>Por quê, e o que fazer →</button>
          </p>
        )}
        {mudou.length > 0 && (
          <div className="retrato-vida__mudou">
            <p className="retrato-vida__rotulo">Mudou no último ano</p>
            <ul>{mudou.map((t, k) => <li key={k}>{t}</li>)}</ul>
          </div>
        )}
        {gente.length > 0 && (
          <div className="retrato-vida__gente">
            <p className="retrato-vida__rotulo">Quem mais importa</p>
            <ul>
              {gente.map(({ p, vin }) => (
                <li key={p.id}>
                  <button type="button" className="retrato-vida__pessoa" onClick={() => abrirPessoa(p.id)}>
                    <Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.pet?.semente ?? p.id} tamanho={34} rotulo={p.nome} especie={p.especie} porte={p.pet?.porte} />
                    <span><strong>{p.nome}</strong> <span className="retrato-vida__papel">{etiqueta(vida, p, vin)}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button type="button" className="link retrato-vida__voce" onClick={() => irPara('voce')}>Como você está, em detalhe — em Você →</button>
      </section>
    </header>
  );
}
