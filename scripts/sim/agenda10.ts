/**
 * REWORK 10 · ROT-05 — personagens de 15 a 25 anos com combinações de base (formação ou amadora), faculdade (meio
 * período, integral, pública, particular), curso técnico e trabalho (meio período, aprendiz, estágio, integral).
 * Cada um propõe as entradas em ordem aleatória, responde às perguntas ao acaso e vive três anos com save/load a cada
 * ano. Conta: o que entrou junto com a base, o que foi recusado e por quê (o texto do motivo), sobreposição de blocos
 * fixos na agenda (tempo duplicado), travamentos (o estouro de pilha do 9.7) e invariantes.
 *
 *   npx esbuild scripts/sim/agenda10.ts --bundle --platform=node --outfile=<scratch>/a10.cjs && N=400 node <scratch>/a10.cjs
 */
import { nova, viverAte } from '../../src/motor/__tests__/ajuda';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { idade, transacao } from '../../src/motor/nucleo';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { criarRng } from '../../src/motor/rng';
import { interpretar } from '../../src/motor/save';
import type { NovoCompromisso, Vida } from '../../src/motor/tipos';
import { analisarEntrada, propor } from '../../src/motor/sistemas/compromissos';
import { agendaDaSemana, sobrepoe } from '../../src/motor/sistemas/agenda';
import { entrarNaBase, entrarPeloAmador } from '../../src/motor/sistemas/esporte';

const N = Number(process.env.N ?? 200);
const conta: Record<string, number> = {};
const somar = (k: string, n = 1) => { conta[k] = (conta[k] ?? 0) + n; };
const motivos: Record<string, number> = {};

function cursoNovo(v: Vida, id: string, rede: 'publica' | 'privada'): NovoCompromisso {
  return { tipo: 'curso', cursoId: id, via: rede === 'privada' ? 'privada' : 'sisu', modalidade: 'presencial', rede, mensalidade: rede === 'privada' ? 1200 : 0, municipioId: v.moradia.municipioId, instituicao: 'a instituição' };
}

function resolver(v: Vida, r: ReturnType<typeof criarRng>): Vida {
  for (let k = 0; k < 12 && v.momento && !v.morte; k++) {
    const ops = v.momento.opcoes.filter(o => !o.bloqueio);
    const op = ops.length ? ops[Math.floor(r.next() * ops.length)] : v.momento.opcoes[0];
    v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida;
  }
  return transacao(v, x => { x.momento = null; }).vida;
}

function semSobreposicao(v: Vida): boolean {
  const a = agendaDaSemana(v);
  const fixos = a.blocos.filter(b => !b.movel && b.origem !== 'trajeto' && b.origem !== 'escola');
  for (let i = 0; i < fixos.length; i++) for (let j = i + 1; j < fixos.length; j++) if (sobrepoe(fixos[i], fixos[j]) && a.presenca[fixos[j].id] === undefined && a.presenca[fixos[i].id] === undefined) return false;
  return true;
}

async function main() {
  await carregarMundo();
  for (let s = 0; s < N; s++) {
    const r = criarRng(1000 + s);
    const alvo = 15 + Math.floor(r.next() * 11);
    let v = viverAte(nova({ semente: 500 + s, genero: r.chance(0.5) ? 'masculino' : 'feminino' }), alvo);
    if (v.morte) continue;
    v = transacao(v, x => { x.momento = null; x.caminhos.pendente = undefined; }).vida;
    const tipoBase = r.next();
    const amador = idade(v) >= 17 && tipoBase < 0.3;
    v = transacao(v, x => {
      x.caminhos.frentes.futebol = { interesse: 80, meses: 100, habilidade: 55 + Math.floor(r.next() * 30), tInicio: x.t - 100, tUltimo: x.t, retomadas: 0, auge: 70 };
      if (amador) { entrarPeloAmador(x, 'futebol', x.moradia.municipioId, 'Clube'); x.rotinas = x.rotinas.filter(y => y.id !== 'futebol'); x.rotinas.push({ id: 'futebol', nivel: 3, tInicio: x.t }); }
      else entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Clube');
    }).vida;
    somar(amador ? 'vidas_amador' : 'vidas_base');
    const i = idade(v);
    const ofertas: [string, NovoCompromisso][] = [];
    if (i >= 17) {
      const c = ['direito', 'administracao', 'medicina', 'eng_civil', 'contabeis'][Math.floor(r.next() * 5)];
      ofertas.push([`curso:${c === 'medicina' || c === 'eng_civil' ? 'integral' : 'parcial'}`, cursoNovo(v, c, r.chance(0.5) ? 'privada' : 'publica')]);
    }
    const job = i < 16 ? undefined : i < 18 ? 'jovem_aprendiz' : ['operador_telemarketing', 'caixa', 'estagio_adm', 'atendente'][Math.floor(r.next() * 4)];
    if (job && r.chance(0.7)) ofertas.push([`emprego:${job}`, { tipo: 'emprego', ocupacaoId: job, via: 'convite' }]);
    if (r.chance(0.5)) ofertas.reverse();
    for (const [rot, o] of ofertas) {
      const conf = analisarEntrada(v, o);
      const base = conf.find(c => c.com === 'base');
      const chave = `${amador ? 'amador' : 'base'}+${rot}`;
      somar(`${chave}:tentou`);
      if (!base) somar(`${chave}:cabe_com_a_base`);
      else {
        const m = base.motivo.replace(/ d[oa] [A-Z][^ ]*/g, ' do clube').replace(/\d+/g, 'N').replace(/\(.*\)/, '(…)');
        motivos[m.slice(0, 90)] = (motivos[m.slice(0, 90)] ?? 0) + 1;
        if (/ocupad|quase todo dia/i.test(base.motivo)) somar('motivo_generico');
        if (base.alternativas.some(a => a.conciliar)) somar(`${chave}:conciliavel`); else somar(`${chave}:nao_cabe`);
      }
      try {
        v = transacao(v, x => { const res = propor(x, r, o); if (res === 'pendente') { x.caminhos.pendente!.perguntado = false; } }).vida;
        if (v.caminhos.pendente) { v = avancarAno(v).vida; v = resolver(v, r); }
      } catch (e) { somar('erro_entrada'); console.log('erro', s, String(e).slice(0, 200)); }
    }
    if (v.caminhos.esporte?.fase === 'base' && v.educacao.matricula && !v.educacao.matricula.trancado) somar('ficou_base_e_curso');
    if (v.caminhos.esporte?.fase === 'base' && v.trabalho.atual) somar('ficou_base_e_trabalho');
    if (v.caminhos.esporte?.fase === 'base' && v.trabalho.atual && v.educacao.matricula && !v.educacao.matricula.trancado) somar('ficou_base_curso_trabalho');
    if (!semSobreposicao(v)) somar('tempo_duplicado');
    for (let k = 0; k < 3 && !v.morte; k++) {
      try {
        v = resolver(avancarAno(v).vida, r);
        const lido = interpretar(JSON.stringify(v));
        if (lido.tipo !== 'ok') somar('save_invalido'); else v = lido.vida;
        if (!Number.isFinite(v.financas.conta)) somar('conta_nan');
      } catch (e) { somar('travou'); console.log('travou', s, String(e).slice(0, 200)); break; }
    }
    if (v.caminhos.esporte?.fase === 'base' || v.caminhos.esporte?.fase === 'profissional') somar('seguiu_no_esporte_3_anos');
  }
  console.log(JSON.stringify(conta, null, 1));
  console.log('\nMotivos de recusa (normalizados):');
  for (const [m, n] of Object.entries(motivos).sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(n, m);
}
main();
