/**
 * REWORK 11.5 · Fase E (era a auditoria REWORK 11 · A3) — 20 anos de carreira de ATOR e de MÚSICO (dos 22 aos 42), N sementes.
 * Ator ativo: testes, temporadas, editais, trabalhos pequenos, agente, aceita toda proposta, lança obra.
 * Músico ativo: banda + musico_profissional, shows, editais, festas, lança obra, turnê.
 * Mede por ano: salário (palco), cachês AV (líquido dos contratos concluídos), ações (conta antes/depois),
 * obra (renda das obras), imagem (patrocínio), notoriedade, ocupação, testes passados/reprovados.
 */
import { adulto } from '../../src/motor/__tests__/cenarios';
import { avancarAno } from '../../src/motor/ano';
import { executar, disponibilidade, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { transacao, idade } from '../../src/motor/nucleo';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { remuneracaoDe } from '../../src/motor/sistemas/renda';
import { rendaDeImagem } from '../../src/motor/sistemas/notoriedade';
import { liquidoDe } from '../../src/motor/sistemas/audiovisual';
import { criarProjeto } from '../../src/motor/sistemas/arte';
import { verbosDoOficio } from '../../src/motor/sistemas/noOficio';
import { acoesDoTrabalho } from '../../src/motor/sistemas/profissao';
import type { Vida } from '../../src/motor/tipos';

const N = Number(process.env.N ?? 30);
const ANOS = Number(process.env.ANOS ?? 20);
const MODO = (process.env.MODO ?? 'ator') as 'ator' | 'musico';
const ATIVO = (process.env.ACOES ?? '1') !== '0';
const P = (oque: string, valor?: string) => ({ tipo: 'perseguir', oque, valor } as unknown as Acao);
const Pr = (oque: string) => ({ tipo: 'profissao', oque } as unknown as Acao);

function responder(v: Vida): Vida {
  for (let k = 0; k < 12 && v.momento && !v.morte; k++) {
    const m = v.momento!;
    const pref = ['ir', 'aceitar', 'pausar', 'seguir', 'sim'];
    const op = pref.map(p => m.opcoes.find(o => o.id === p && !o.bloqueio)).find(Boolean) ?? m.opcoes.find(o => !o.bloqueio) ?? m.opcoes[0];
    v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida;
  }
  return v;
}
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const f = (x: number) => Math.round(x).toLocaleString('pt-BR');

const porAno: { sal: number[]; av: number[]; acoes: number[]; obra: number[]; imagem: number[]; total: number[]; noto: number[] }[] = Array.from({ length: ANOS }, () => ({ sal: [], av: [], acoes: [], obra: [], imagem: [], total: [], noto: [] }));
const marcos = { reconhecido: [] as number[], extra100k: [] as number[], extra500k: [] as number[], extra1m: [] as number[], testesOk: 0, testesNao: 0, contratos: 0, conviteDireto: 0, propostasRecusadasPorConflito: 0, conviteMesmaCarreira: 0, convitesVistos: [] as string[], verbosChefia: 0, clienteGrande: 0, perdeuCarreira: 0, ocupFinal: {} as Record<string, number>, acoesGen: new Set<string>() };

for (let s = 0; s < N; s++) {
  let v = adulto(22, { semente: 7000 + s * 13, genero: s % 2 ? 'masculino' : 'feminino' });
  const d = MODO === 'ator' ? 'teatro' : 'musica';
  v = transacao(v, (x, r) => {
    x.id = `${x.id}-a3-${MODO}-${s}`;
    const fr = garantirFrente(x, d); fr.habilidade = 66; fr.interesse = 80; fr.meses = 60;
    x.rotinas = x.rotinas.filter(rt => rt.id !== d); x.rotinas.push({ id: d, tInicio: x.t, nivel: 2 });
    x.financas.conta = Math.max(x.financas.conta, 8000);
    if (MODO === 'musico' && ATIVO) { criarProjeto(x, r, 'musica'); x.caminhos.arte!.publico = 45; }
    contratar(x, r, ocupacao(MODO === 'ator' ? 'ator' : 'musico_profissional'), 'teste');
  }).vida;
  const vistos = new Set<string>();
  const contados = new Set<string>();
  let ganhouReconh = -1, e100 = -1, e500 = -1, e1m = -1;
  for (let a = 0; a < ANOS && !v.morte; a++) {
    let acoes = 0;
    const lista: Acao[] = !ATIVO ? [] : MODO === 'ator'
      ? [P('buscar_agente'), P('audicao'), P('audicao'), P('apresentar'), P('edital'), P('trabalho_pequeno'), Pr('lancar')]
      : [P('apresentar'), P('edital'), P('trabalho_pequeno'), Pr('lancar'), Pr('estrada')];
    for (const ac of lista) {
      if (!podeTentar(disponibilidade(v, ac))) continue;
      const antes = v.financas.conta;
      const devol = v.caminhos.devolutivas.length;
      const props = (v.caminhos.audiovisual?.contratos ?? []).length;
      v = executar(v, ac).vida; v = responder(v);
      if ((ac as { oque?: string }).oque === 'audicao') { if ((v.caminhos.audiovisual?.contratos ?? []).length > props) marcos.testesOk++; else if (v.caminhos.devolutivas.length > devol) marcos.testesNao++; }
      if ((ac as { oque?: string }).oque !== 'lancar') acoes += v.financas.conta - antes;
    }
    // aceita todas as propostas abertas
    for (const c of (v.caminhos.audiovisual?.contratos ?? []).filter(c => ATIVO && c.status === 'proposta')) {
      const ac = P('aceitar_contrato', c.id);
      if (podeTentar(disponibilidade(v, ac))) { v = executar(v, ac).vida; v = responder(v); marcos.contratos++; if (c.convite) marcos.conviteDireto++; }
    }
    const obrasAntes = (v.caminhos.obras ?? []).length;
    const tAntes = v.t;
    const bioAntes = v.biografia.length;
    v = avancarAno(v).vida; v = responder(v);
    if (v.morte) break;
    // Acontecimentos genéricos aplicados ao artista
    for (const b of v.biografia.slice(bioAntes)) {
      if (/cliente grande|cliente satisfeito|trabalho grande, desses/.test(b.texto)) marcos.clienteGrande++;
      if (/A empresa pagou|certificação nova|sistema novo chegou/.test(b.texto)) marcos.acoesGen.add(b.texto.slice(0, 40));
    }
    let av = 0;
    for (const c of v.caminhos.audiovisual?.contratos ?? []) if (c.status === 'concluido' && !contados.has(c.id)) { contados.add(c.id); av += liquidoDe(c); }
    const obra = (v.caminhos.obras ?? []).filter(o => o.t >= tAntes - 1).slice(obrasAntes ? 0 : 0).reduce((s2, o) => s2 + (o.t >= tAntes - 1 && o.t <= v.t ? o.renda : 0), 0);
    const e = v.trabalho.atual;
    const sal = e ? remuneracaoDe(e).mediaMensal * 12 : 0;
    const par = v.trabalho.paralela ? remuneracaoDe(v.trabalho.paralela).mediaMensal * 12 : 0;
    const img = rendaDeImagem(v) * 12;
    const total = sal + par + av + acoes + obra + img;
    const pa = porAno[a];
    pa.sal.push(sal + par); pa.av.push(av); pa.acoes.push(acoes); pa.obra.push(obra); pa.imagem.push(img); pa.total.push(total); pa.noto.push(v.notoriedade?.valor ?? 0);
    if (e?.ocupacaoId === 'ator_reconhecido' && ganhouReconh < 0) ganhouReconh = a + 1;
    if (total >= 100000 && e100 < 0) e100 = a + 1;
    if (total >= 500000 && e500 < 0) e500 = a + 1;
    if (total >= 1000000 && e1m < 0) e1m = a + 1;
    for (const o of v.caminhos.oportunidades) {
      if (vistos.has(o.id)) continue; vistos.add(o.id);
      marcos.convitesVistos.push(`${o.tipo}:${o.ocupacaoId ?? ''}:${o.titulo} [atual=${e?.ocupacaoId}]`);
      if (o.tipo === 'convite' && o.ocupacaoId && e && ocupacao(o.ocupacaoId).trilha === ocupacao(e.ocupacaoId).trilha) marcos.conviteMesmaCarreira++;
    }
    if (!e || !['cena', 'musica'].includes(ocupacao(e.ocupacaoId).trilha)) { marcos.perdeuCarreira++; }
    if (verbosDoOficio(v).some(x => ['capacitacao', 'chefia', 'projeto', 'divulgar', 'caprichar'].includes(x.oque))) marcos.verbosChefia++;
    try { const ac = acoesDoTrabalho(v, disponibilidade as never); for (const x of [...(ac as { principais?: { id: string }[] }).principais ?? [], ...((ac as { outras?: { id: string }[] }).outras ?? [])]) if (['aumento', 'promocao', 'horas', 'outra_vaga', 'preco_alto', 'estrutura', 'mei'].includes(x.id)) marcos.acoesGen.add(`${e?.ocupacaoId}:${x.id}`); } catch { /* */ }
  }
  marcos.reconhecido.push(ganhouReconh); marcos.extra100k.push(e100); marcos.extra500k.push(e500); marcos.extra1m.push(e1m);
  const oc = v.trabalho.atual?.ocupacaoId ?? '(sem)';
  marcos.ocupFinal[oc] = (marcos.ocupFinal[oc] ?? 0) + 1;
  if (process.env.DEBUG) console.error(s, idade(v), oc, v.notoriedade?.valor, (v.caminhos.curriculo ?? []).length, v.caminhos.audiovisual?.agente?.rede);
}

console.log(`\n## ${MODO.toUpperCase()} — ${N} vidas, ${ANOS} anos (22→${22 + ANOS}). Renda anual em R$ (mediana · p90)`);
console.log('| ano | salário/palco | cachês AV | ações (testes, temporadas, editais, pequenos) | obra | imagem | TOTAL med · p90 · max | notoriedade med · p90 |');
console.log('|---|---|---|---|---|---|---|---|');
for (let a = 0; a < ANOS; a++) {
  const x = porAno[a];
  console.log(`| ${a + 1} | ${f(pct(x.sal, 0.5))} · ${f(pct(x.sal, 0.9))} | ${f(pct(x.av, 0.5))} · ${f(pct(x.av, 0.9))} | ${f(pct(x.acoes, 0.5))} · ${f(pct(x.acoes, 0.9))} | ${f(pct(x.obra, 0.5))} · ${f(pct(x.obra, 0.9))} | ${f(pct(x.imagem, 0.5))} · ${f(pct(x.imagem, 0.9))} | ${f(pct(x.total, 0.5))} · ${f(pct(x.total, 0.9))} · ${f(Math.max(...x.total))} | ${Math.round(pct(x.noto, 0.5))} · ${Math.round(pct(x.noto, 0.9))} |`);
}
const ok = (xs: number[]) => xs.filter(x => x > 0);
const p1m = (a: number) => porAno[a] ? porAno[a].total.filter(x => x >= 1e6).length : 0;
console.log(`\n>=1mi/ano: ano5 ${p1m(4)}/${N} ano10 ${p1m(9)}/${N} ano20 ${p1m(19)}/${N}; vidas com algum ano >=1mi ${marcos.extra1m.filter(x=>x>0).length}`);
console.log(`\nator_reconhecido: ${ok(marcos.reconhecido).length}/${N} (ano med ${pct(ok(marcos.reconhecido), 0.5)}); ≥100 mil/ano: ${ok(marcos.extra100k).length}/${N} (ano med ${pct(ok(marcos.extra100k), 0.5)}); ≥500 mil: ${ok(marcos.extra500k).length}/${N} (ano med ${pct(ok(marcos.extra500k), 0.5)}); ≥1 mi: ${ok(marcos.extra1m).length}/${N}`);
console.log(`testes: ${marcos.testesOk} passou / ${marcos.testesNao} não passou; contratos aceitos ${marcos.contratos} (convite direto ${marcos.conviteDireto})`);
console.log(`anos fora da carreira: ${marcos.perdeuCarreira}; anos com verbos de chefia/freguesia: ${marcos.verbosChefia}; "cliente grande" a artista: ${marcos.clienteGrande}`);
console.log(`convites da MESMA trilha recebidos já na carreira: ${marcos.conviteMesmaCarreira}`);
console.log('ocupação final:', JSON.stringify(marcos.ocupFinal));
console.log('ações/acontecimentos genéricos vistos:', JSON.stringify([...marcos.acoesGen]));
const cont: Record<string, number> = {}; for (const c of marcos.convitesVistos) { const k = c.replace(/"[^"]*"/g, '"…"'); cont[k] = (cont[k] ?? 0) + 1; }
console.log('portas vistas:', JSON.stringify(Object.entries(cont).sort((a, b) => b[1] - a[1]).slice(0, 25), null, 0));
