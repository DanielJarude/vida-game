/**
 * VIDA 19 · sim: as vidas próprias dos NPCs em vidas longas, sem ação do jogador.
 *   N vidas × ANOS anos: o que aconteceu com quem importa (uniões, separações, filhos, dívidas, negócios, mudanças,
 *   promoções, afastamentos, laços entre eles), as contradições de estado (parceria que não aponta de volta, morto com
 *   parceria, filho sem genitor vivo na ficha), o tamanho do save e o custo do ano. DET=1 roda a mesma semente duas vezes.
 *   npx esbuild scripts/sim/vidas19.ts --bundle --platform=node --outfile=<scratch>/v19.cjs && node <scratch>/v19.cjs
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import type { Vida } from '../../src/motor/tipos';

const N = Number(process.env.N ?? 12);
const ANOS = Number(process.env.ANOS ?? 70);
const conta: Record<string, number> = {};
const soma = (k: string, n = 1) => { conta[k] = (conta[k] ?? 0) + n; };
const contradicoes: string[] = [];
let ms = 0, anos = 0, maiorSave = 0;

function viver(s: number): Vida {
  let v: Vida = criarVida({ nome: 'Ana', sobrenome: 'Silva', genero: s % 2 ? 'feminino' : 'masculino', municipioId: ['recife-pe', 'sao-paulo-sp', 'porto-alegre-rs', 'belo-horizonte-mg'][s % 4], semente: s * 11 + 5 });
  for (let a = 0; a < ANOS && !v.morte; a++) {
    const antes = new Map(Object.values(v.pessoas).map(p => [p.id, p.vida?.trajetoria?.length ?? 0]));
    const t0 = performance.now();
    const x = avancarAno(v).vida; x.momento = null; (x as Vida & { fila?: unknown }).fila = undefined; v = x;
    ms += performance.now() - t0; anos++;
    for (const p of Object.values(v.pessoas)) {
      const novo = (p.vida?.trajetoria ?? []).slice(antes.get(p.id) ?? 0);
      if (!p.npc19) continue;
      for (const t of novo) {
        const k = /Casou|morar com/.test(t.texto) ? 'uniao' : /Separou|Terminou/.test(t.texto) ? 'separacao' : /Voltou com/.test(t.texto) ? 'reconciliacao' : /Começou a namorar/.test(t.texto) ? 'namoro'
          : /Nasceu/.test(t.texto) ? 'nascimento' : /grávida|Vai ser/.test(t.texto) ? 'gravidez' : /abriu .* com o que tinha/i.test(t.texto) ? 'negocio_aberto' : /Fechou/.test(t.texto) ? 'negocio_fechou'
            : /segunda unidade/.test(t.texto) ? 'negocio_cresceu' : /promovid/.test(t.texto) ? 'promocao' : /Trocou de empresa/.test(t.texto) ? 'troca_emprego' : /Perdeu o emprego/.test(t.texto) ? 'desemprego'
              : /Arrumou trabalho/.test(t.texto) ? 'recolocacao' : /Afastou-se/.test(t.texto) ? 'afastamento' : /Voltou ao trabalho/.test(t.texto) ? 'volta_trabalho' : /Mudou-se|Voltou para|Voltou a morar/.test(t.texto) ? 'mudanca'
                : /Comprou/.test(t.texto) ? 'compra' : /Vendeu/.test(t.texto) ? 'venda' : /Quitou/.test(t.texto) ? 'quitou' : /Cortou|bico|Dividiu|menor/.test(t.texto) ? 'aperto_decisao' : /Lançou|Estreou|Saiu em turnê|campanha|temporada/.test(t.texto) ? 'famoso' : /polêmica/.test(t.texto) ? 'polemica' : 'outro';
        soma(k);
      }
    }
    // Contradições de estado.
    for (const p of Object.values(v.pessoas)) {
      if (p.parceiroId && p.parceiroId !== 'fora') {
        const q = v.pessoas[p.parceiroId];
        if (!q) contradicoes.push(`${s}/${a}: ${p.id} aponta parceria inexistente`);
        else if (p.vivo && q.vivo && q.parceiroId !== p.id && p.npc19) contradicoes.push(`${s}/${a}: ${p.nome} → ${q.nome} → ${q.parceiroId}`);
        else if (!p.vivo && p.npc19?.uniao) contradicoes.push(`${s}/${a}: morto ${p.nome} com união`);
      }
      const u = p.npc19?.uniao;
      if (p.vivo && u && p.parceiroId !== u.com && p.npc19) contradicoes.push(`${s}/${a}: ${p.nome} união com ${u.com} mas parceria ${p.parceiroId}`);
      if (p.npc19 && (p.npc19.divida < 0 || p.npc19.reserva < 0 || !Number.isFinite(p.npc19.reserva))) contradicoes.push(`${s}/${a}: ${p.nome} bolso inválido`);
    }
  }
  return v;
}

for (let s = 1; s <= N; s++) {
  const v = viver(s);
  const tam = JSON.stringify(v).length;
  maiorSave = Math.max(maiorSave, tam);
  const acomp = Object.values(v.pessoas).filter(p => p.npc19);
  soma('acompanhados', acomp.length);
  soma('q19_pessoas', Object.keys(v.pessoas).filter(k => k.startsWith('q19')).length);
  soma('lacos', acomp.reduce((x, p) => x + (p.npc19!.lacos?.length ?? 0), 0));
  soma('rivalidades', acomp.reduce((x, p) => x + (p.npc19!.lacos?.filter(l => l.tipo === 'rivalidade').length ?? 0), 0));
  soma('com_divida', acomp.filter(p => p.npc19!.divida > 0).length);
  soma('com_posses', acomp.filter(p => p.npc19!.posses?.length).length);
  soma('fora_restante', Object.values(v.pessoas).filter(p => p.parceiroId === 'fora').length);
  soma('linhas_vida19', v.biografia.filter(e => (e.fato?.dados as { fonte?: string } | undefined)?.fonte === 'vida19').length);
  soma('kb_save', Math.round(tam / 1024));
}
if (process.env.DET) {
  const a = JSON.stringify(viver(3)), b = JSON.stringify(viver(3));
  console.log('determinismo (mesma semente, duas vezes):', a === b ? 'IGUAL' : 'DIFERENTE');
}
console.log(JSON.stringify({ N, ANOS, msPorAno: +(ms / anos).toFixed(1), maiorSaveKb: Math.round(maiorSave / 1024), conta }, null, 1));
console.log('contradições:', contradicoes.length, contradicoes.slice(0, 12));
