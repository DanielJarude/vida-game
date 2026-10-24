/**
 * REWORK 11 — simulação de coerência (Fase J): vidas inteiras com os perfis de `agentes`, contando ano a ano o que o
 * REWORK 11 diz que não deveria acontecer. Só usa leituras que já existiam na base (b885ccc^), para medir igual nos dois:
 *
 *   jornada>66      anos com o trabalho principal ocupando mais de 66 horas por semana na agenda (ROT-11.1)
 *   conflitoCasa    anos com o cuidado do bicho ou dos filhos perdendo para o trabalho na agenda (ROT-11.2)
 *   sonhoErrado     "O sonho que ficou para trás" aberto para quem jogou temporadas profissionais depois (EVT-11.7)
 *   noivadoSobra    anos com o fato `noivado_<id>` de alguém com quem já se casou ou terminou (REL-16)
 *   felizTitulo     felicidade média dos atletas profissionais nos 24 meses depois de um título × sem título (ROT-11.3)
 *   travou, ms/ano  erros e o tempo médio de um ano
 *
 *   npx esbuild scripts/sim/coerencia11.ts --bundle --platform=node --outfile=<scratch>/c11.cjs && N=8 node <scratch>/c11.cjs
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar, disponibilidade } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { agendaDaSemana, blocosDoTrabalho } from '../../src/motor/sistemas/agenda';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { agente } from './agentes';

const N = Number(process.env.N ?? 8);
const ATE = Number(process.env.ATE ?? 75);
const PERFIS = ['estudioso', 'trabalhador', 'esportista', 'familiar', 'social', 'equilibrado', 'arriscado', 'aleatorio'];

const horasDoTrabalho = (v: Vida) => blocosDoTrabalho(v).reduce((s, b) => s + (b.dias.length * (b.fim - b.inicio)) / 60 / (b.alternado ? 2 : 1), 0);

async function principal() {
  await carregarMundo();
  const c = { vidas: 0, anos: 0, anosComTrabalho: 0, jornadaMais66: 0, maiorJornada: 0, conflitoCasa: 0, sonhoAberto: 0, sonhoErrado: 0, noivadoSobra: 0, travou: 0, ms: 0 };
  const feliz = { comTitulo: [] as number[], semTitulo: [] as number[] };
  for (const perfil of PERFIS) for (let k = 0; k < N; k++) {
    const semente = 110000 + PERFIS.indexOf(perfil) * 1000 + k;
    let v: Vida = criarVida({ nome: 'Ana', sobrenome: 'Silva', genero: k % 2 ? 'feminino' : 'masculino', municipioId: k % 3 ? 'recife-pe' : 'sao-paulo-sp', semente });
    const ag = agente(perfil);
    const r = criarRng(semente);
    const decidir = () => {
      for (let j = 0; j < 12 && v.momento && !v.morte; j++) {
        const m = v.momento!;
        if (/sonho/i.test(m.titulo) && /ficou para trás/i.test(m.titulo)) {
          c.sonhoAberto++;
          const temporadas = [v.caminhos.esporte, ...(v.caminhos.carreirasEsportivas ?? [])].reduce((s, e) => s + (e?.temporadas?.length ?? 0), 0);
          if (temporadas > 0) c.sonhoErrado++;
        }
        v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, m, r) }).vida;
      }
    };
    try {
      while (!v.morte && idade(v) < ATE) {
        const t0 = performance.now();
        for (const a of ag.agir(v, r)) { if (!podeTentar(disponibilidade(v, a))) continue; v = executar(v, a).vida; decidir(); }
        decidir();
        v = avancarAno(v).vida;
        decidir();
        c.ms += performance.now() - t0;
        c.anos++;
        if (v.trabalho.atual) {
          c.anosComTrabalho++;
          const h = horasDoTrabalho(v);
          c.maiorJornada = Math.max(c.maiorJornada, h);
          if (h > 66) c.jornadaMais66++;
        }
        if (agendaDaSemana(v).conflitos.some(x => x.perde === 'pets' || x.perde.startsWith('filhos'))) c.conflitoCasa++;
        for (const k2 of Object.keys(v.fatos)) {
          if (!k2.startsWith('noivado_')) continue;
          const e = v.vinculos[k2.slice('noivado_'.length)]?.romance?.estagio;
          if (e === 'casamento' || e === 'ex') c.noivadoSobra++;
        }
        const es = v.caminhos.esporte;
        if (es?.fase === 'profissional' && v.trabalho.atual) {
          const titulo = (v.caminhos.palmares ?? []).some(p => p.tipo === 'titulo' && v.t - p.t >= 0 && v.t - p.t < 24);
          (titulo ? feliz.comTitulo : feliz.semTitulo).push(v.mente.felicidade);
        }
      }
    } catch (e) { c.travou++; console.error(perfil, semente, (e as Error).message); }
    c.vidas++;
  }
  const media = (xs: number[]) => (xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10 : null);
  console.log(JSON.stringify({ ...c, maiorJornada: Math.round(c.maiorJornada), msPorAno: Math.round((c.ms / c.anos) * 10) / 10,
    felicidadeAtletaComTitulo: media(feliz.comTitulo), anosComTitulo: feliz.comTitulo.length,
    felicidadeAtletaSemTitulo: media(feliz.semTitulo), anosSemTitulo: feliz.semTitulo.length }, null, 1));
}

void principal();
