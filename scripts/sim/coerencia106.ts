/**
 * REWORK 10.6 — simulação de coerência: vidas inteiras com os perfis de `agentes`, contando ano a ano o que NUNCA deveria
 * acontecer depois do 10.6 — e que dá para medir igual na base (só usa leituras que já existiam):
 *
 *   sobreposicao   anos com o trabalho em cima da escola ou do curso (dois compromissos presenciais obrigatórios)
 *   duplicada      anos com a mesma carreira artística no trabalho principal e na paralela
 *   goleiro        anos em que o goleiro profissional recebe "Treino extra: finalização"
 *   fimDoMedio     atletas profissionais (ou com emprego de verdade) diante do "E agora?" genérico do fim do médio
 *   imortais       pessoas vivas com mais de 105 anos no fim da vida (o mundo que não morre)
 *   ms/ano         o tempo médio de um ano
 *
 *   npx esbuild scripts/sim/coerencia106.ts --bundle --platform=node --outfile=<scratch>/c106.cjs && N=8 node <scratch>/c106.cjs
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar, disponibilidade } from '../../src/motor/acoes';
import { idade, idadePessoa } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { agendaDaSemana } from '../../src/motor/sistemas/agenda';
import { verbosDoOficio } from '../../src/motor/sistemas/noOficio';
import { ocupacaoOuNula } from '../../src/motor/dados/ocupacoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { agente } from './agentes';

const N = Number(process.env.N ?? 8);
const ATE = Number(process.env.ATE ?? 80);
const PERFIS = ['estudioso', 'trabalhador', 'esportista', 'familiar', 'social', 'equilibrado', 'arriscado', 'aleatorio'];
const ART = new Set(['cena', 'musica', 'danca', 'literatura', 'conteudo', 'ilustracao', 'imagem', 'orquestra']);

async function principal() {
  await carregarMundo();
  const c = { anos: 0, sobreposicao: 0, duplicada: 0, goleiro: 0, fimDoMedio: 0, fimDoMedioCarreira: 0, imortais: 0, travou: 0, ms: 0, pessoas: 0, vidas: 0 };
  for (const perfil of PERFIS) for (let k = 0; k < N; k++) {
    const semente = 106000 + PERFIS.indexOf(perfil) * 1000 + k;
    let v: Vida = criarVida({ nome: 'Ana', sobrenome: 'Silva', genero: k % 2 ? 'feminino' : 'masculino', municipioId: k % 3 ? 'recife-pe' : 'sao-paulo-sp', semente });
    const ag = agente(perfil);
    const r = criarRng(semente);
    const decidir = (contar: boolean) => { for (let j = 0; j < 12 && v.momento && !v.morte; j++) { const m = v.momento!; if (contar) { if (m.situacaoId === 'esc_fim_do_medio' && (v.caminhos.esporte?.fase === 'profissional' || (v.trabalho.atual && v.trabalho.atual.carga !== 'parcial' && !['aprendiz', 'estagio', 'informal'].includes(v.trabalho.atual.contrato)))) c.fimDoMedio++; if (m.situacaoId === 'esc_fim_do_medio_carreira') c.fimDoMedioCarreira++; } v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, m, r) }).vida; } };
    try {
      while (!v.morte && idade(v) < ATE) {
        const t0 = performance.now();
        for (const a of ag.agir(v, r)) { if (!podeTentar(disponibilidade(v, a))) continue; v = executar(v, a).vida; decidir(false); }
        decidir(false);
        v = avancarAno(v).vida;
        decidir(true);
        c.ms += performance.now() - t0;
        c.anos++;
        const ag2 = agendaDaSemana(v);
        const sob = ag2.conflitos.find(x => x.tipo === 'sobreposicao' && (x.perde === 'escola' || x.perde === 'curso') && (x.ocupa ?? '').startsWith('trabalho'));
        if (sob) { c.sobreposicao++; if (process.env.DEBUG) console.error('SOB', perfil, semente, idade(v), v.trabalho.atual?.ocupacaoId, v.trabalho.atual?.carga, JSON.stringify(v.agenda?.turnos), sob.texto); }
        const a = v.trabalho.atual, p = v.trabalho.paralela;
        const oa = a ? ocupacaoOuNula(a.ocupacaoId) : undefined, op = p ? ocupacaoOuNula(p.ocupacaoId) : undefined;
        if (oa && op && oa.trilha === op.trilha && ART.has(oa.trilha)) c.duplicada++;
        if (v.caminhos.esporte?.fase === 'profissional' && v.caminhos.esporte.posicao === 'goleiro' && verbosDoOficio(v).some(x => /finaliza/i.test(x.rotulo))) c.goleiro++;
      }
    } catch (e) { c.travou++; console.error(perfil, semente, (e as Error).message); }
    c.vidas++;
    c.pessoas += Object.values(v.pessoas).filter(x => x.vivo).length;
    c.imortais += Object.values(v.pessoas).filter(x => x.vivo && !x.especie && idadePessoa(v, x) > 105).length;
  }
  console.log(JSON.stringify({ ...c, msPorAno: Math.round((c.ms / c.anos) * 10) / 10, pessoasVivasPorVida: Math.round(c.pessoas / c.vidas) }, null, 1));
}

void principal();
