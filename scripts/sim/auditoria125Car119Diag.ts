/** AUDITORIA 12.5 · CAR-11.9 — diagnóstico: cenas sorteadas × vividas (por que o atleta vive poucas cenas). */
import { adulto } from '../../src/motor/__tests__/cenarios';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { transacao } from '../../src/motor/nucleo';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { entrarNaBase, profissionalizar } from '../../src/motor/sistemas/esporte';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { trajetoriaDeSituacao, chanceDeMomento, DECISOES_DE_CONTRATO } from '../../src/motor/sistemas/situacoes';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { estrategia } from './estrategias';

const PREP: Record<string, (x: Vida, r: ReturnType<typeof criarRng>, s: number) => void> = {
  futebol: (x, r) => { x.trabalho.atual = undefined; garantirFrente(x, 'futebol'); Object.assign(x.caminhos.frentes.futebol!, { habilidade: 84, interesse: 90, meses: 140, auge: 84 }); entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Sport'); profissionalizar(x, r, 2); },
  basquete: (x, r) => { x.trabalho.atual = undefined; garantirFrente(x, 'basquete' as never); Object.assign((x.caminhos.frentes as never as Record<string, object>).basquete, { habilidade: 84, interesse: 90, meses: 140, auge: 84 }); entrarNaBase(x, 'basquete' as never, x.moradia.municipioId, 'Clube Teste'); profissionalizar(x, r, 2); },
  medicina: (x, r) => { x.trabalho.atual = undefined; x.educacao.concluidos.push({ cursoId: 'medicina', nome: 'Medicina', nivel: 'superior', area: 'medicina', tFim: x.t - 36, instituicao: 'a universidade federal' } as never); contratar(x, r, ocupacao('medico_hospital'), 'concurso'); },
  policial: (x, r) => { x.trabalho.atual = undefined; contratar(x, r, ocupacao('policial_civil'), 'concurso'); }
};
async function principal() {
  await carregarMundo();
  for (const c of ['futebol', 'basquete']) {
    const quem = new Map<string, number>(); let sort = 0, vivid = 0, anos = 0, chance = 0, aberta = 0;
    for (let s = 1; s <= 6; s++) {
      const r = criarRng(s * 97 + 5);
      let v = adulto(c === 'futebol' || c === 'basquete' ? 18 : 28, { semente: 777 + s * 13, genero: s % 2 ? 'masculino' : 'feminino', municipioId: 'recife-pe' });
      v = transacao(v, (x, rr) => { PREP[c](x, rr, s); x.momento = null; }).vida;
      const tr0 = trajetoriaDeSituacao(v);
      const e = estrategia('passivo');
      for (let k = 0; k < 15 && !v.morte; k++) {
        if (trajetoriaDeSituacao(v) !== tr0) break;
        anos++; chance += chanceDeMomento(v, tr0!);
        const n0 = (v.caminhos.situacoes ?? []).filter(x => !DECISOES_DE_CONTRATO.has(x.id)).length;
        v = avancarAno(v).vida;
        const sit = v.caminhos.situacao;
        if (sit && sit.t === v.t) { sort++; if (v.momento?.situacaoId === 'car_situacao') aberta++; else quem.set(`${v.momento?.situacaoId ?? 'nenhum'}${v.fila?.some(f => f.id === 'car_situacao') ? '+fila' : ''}${sit.dados._adiada ? '(re)' : ''}`, (quem.get(`${v.momento?.situacaoId ?? 'nenhum'}${v.fila?.some(f => f.id === 'car_situacao') ? '+fila' : ''}${sit.dados._adiada ? '(re)' : ''}`) ?? 0) + 1); }
        for (let j = 0; j < 15 && v.momento && !v.morte; j++) { const m = v.momento; v = executar(v, { tipo: 'decidir', opcaoId: e.decidir(v, m, r) }).vida; }
        const n1 = (v.caminhos.situacoes ?? []).filter(x => !DECISOES_DE_CONTRATO.has(x.id)).length;
        vivid += n1 - n0;
      }
    }
    console.log(`${c}: anos ${anos} · chance média ${(chance / anos).toFixed(2)} · situação sorteada/posta ${sort} (${(sort / anos).toFixed(2)}/ano) · car_situacao aberta logo ${aberta} · cenas vividas ${vivid} (${(vivid / anos).toFixed(2)}/ano) · quem ocupou: ${[...quem].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}:${n}`).join(' ')}`);
  }
}
principal();
