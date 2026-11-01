/**
 * VIDA 12.6 — a viabilidade do pequeno negócio (pendência da 12.5: 13 de 20 lanchonetes fechavam em 2 anos). N vidas por
 * perfil abrem o negócio (direto, sem a decisão de abertura) e seguem ANOS anos; nas decisões, o dono sensato insiste
 * uma vez no aperto e fecha na segunda; nas outras, a primeira opção. Mede: fechou em 2 anos, em 5, ainda aberto no fim,
 * a retirada média do dono, a clientela no fim, e a razão do fechamento.
 *   npx esbuild scripts/sim/negocios126.ts --bundle --platform=node --format=esm --outfile=<s>/n.mjs && N=20 ANOS=8 node <s>/n.mjs
 * PERFIS: veterano (3 anos na trilha, cozinha boa, capital), novato (sem estrada), cidade_pequena (veterano numa cidade pequena).
 */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { abrirNegocio } from '../../src/motor/sistemas/negocio';
import { criarRng } from '../../src/motor/rng';
import { transacao } from '../../src/motor/nucleo';
import type { Vida } from '../../src/motor/tipos';

await carregarMundo();
const N = Number(process.env.N ?? 20), ANOS = Number(process.env.ANOS ?? 8), TIPO = process.env.TIPO ?? 'lanchonete';
const PERFIS: Record<string, { cidade: string; meses: number; cozinha: number }> = {
  veterano: { cidade: 'sao-paulo-sp', meses: 36, cozinha: 60 },
  novato: { cidade: 'sao-paulo-sp', meses: 0, cozinha: 40 },
  cidade_pequena: { cidade: process.env.PEQUENA ?? 'tefe-am', meses: 36, cozinha: 60 }
};
for (const [nome, pf] of Object.entries(PERFIS)) {
  let f2 = 0, f5 = 0, aberto = 0; const ret: number[] = [], cli: number[] = [], razoes: Record<string, number> = {}, fim: Record<string, number> = {};
  for (let k = 0; k < N; k++) {
    let v: Vida = adulto(30, { semente: 9000 + k, municipioId: pf.cidade });
    v = transacao(v, x => {
      x.financas.conta = 60000; x.momento = null;
      x.trabalho.experiencia['alimentacao'] = pf.meses;
      const fr = x.caminhos.frentes as Record<string, { habilidade: number; interesse: number; meses: number; tInicio: number; tUltimo: number; retomadas: number; auge: number }>;
      fr.cozinha = { habilidade: pf.cozinha, interesse: 70, meses: 60, tInicio: x.t - 60, tUltimo: x.t, retomadas: 0, auge: pf.cozinha };
      abrirNegocio(x, criarRng(k + 1), TIPO);
    }).vida;
    const t0 = v.t; let fechouEm: number | undefined; let insistiu = false;
    for (let a = 0; a < ANOS && !v.morte; a++) {
      let guard = 0;
      while (v.momento && guard++ < 6) {
        const m = v.momento as { decisao?: { id: string; opcoes?: { id: string }[] }; id?: string; opcoes?: { id: string }[] };
        const id = (m as { conteudoId?: string }).conteudoId ?? m.decisao?.id ?? m.id ?? '';
        const ops = (m.decisao?.opcoes ?? m.opcoes ?? []).map(o => o.id);
        let op = ops[0];
        if (/neg_aperto/.test(id)) { op = !insistiu && ops.includes('insistir') ? 'insistir' : ops.includes('fechar') ? 'fechar' : ops[0]; insistiu = true; }
        if (!op) { v = transacao(v, x => { x.momento = null; }).vida; break; }
        v = executar(v, { tipo: 'decidir', opcaoId: op }).vida;
      }
      const ant = v.caminhos.negocio;
      v = avancarAno(v).vida;
      const n = v.caminhos.negocio;
      if (ant && ant.estado !== 'fechado' && (!n || n.estado === 'fechado') && fechouEm === undefined) {
        fechouEm = (v.t - t0) / 12;
        const ult = v.biografia.slice(-8).map(e => e.texto).find(t => /fech|encerr|vend/i.test(t)) ?? '?';
        const r = /clientela|freguesia|movimento/i.test(ult) ? 'clientela' : /dívida|banco|fornecedor/i.test(ult) ? 'dívidas' : /vend/i.test(ult) ? 'vendeu' : 'decidiu fechar';
        razoes[r] = (razoes[r] ?? 0) + 1;
      }
      if (v.caminhos.negocio && v.caminhos.negocio.estado !== 'fechado') ret.push(v.caminhos.negocio.retiradaAno ?? 0);
    }
    const nf = v.caminhos.negocio; const chaveFim = v.morte ? 'morreu' : !nf ? 'sem negócio' : nf.estado; fim[chaveFim] = (fim[chaveFim] ?? 0) + 1;
    if (fechouEm !== undefined && fechouEm <= 2.01) f2++;
    if (fechouEm !== undefined && fechouEm <= 5.01) f5++;
    if (fechouEm === undefined && v.caminhos.negocio && v.caminhos.negocio.estado !== 'fechado') { aberto++; cli.push(v.caminhos.negocio.clientela); }
  }
  const media = (xs: number[]) => (xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : 0);
  console.log(`${TIPO} · ${nome.padEnd(15)} fechou≤2a ${f2}/${N} · ≤5a ${f5}/${N} · aberto no fim ${aberto}/${N} · retirada média/ano ${media(ret)} · clientela no fim ${media(cli)} · razões ${JSON.stringify(razoes)} · no fim ${JSON.stringify(fim)}`);
}
