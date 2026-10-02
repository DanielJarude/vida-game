/**
 * Simulação de sucessão (pacote pré-América do Sul, Parte L4): famílias
 * inteiras, geração após geração, pelo que o jogador pode fazer.
 *
 *   npx esbuild scripts/sim/sucessao.ts --bundle --platform=node --outfile=/tmp/suc.cjs
 *   FAMILIAS=40 GERACOES=4 node /tmp/suc.cjs
 *
 * Cada família: uma vida vivida até morrer (respondendo com a primeira opção
 * livre; quem passa dos 95 morre por decisão do script). Se há filho elegível,
 * escolhe um (o do meio, para não favorecer o primogênito) e uma partilha que
 * varia por família (lei, testamento a favor de alguém, doação). Confere a
 * cada sucessão:
 *   - a partilha fecha no real (bruto = dívidas + meação + quinhões + doação + custos + vacante);
 *   - o patrimônio da família antes = depois + custos + doação + vacante (− economias que só passam a ser contadas);
 *   - nenhum bem com dois donos; nenhum id de pessoa duplicado; a herdeira não está em `pessoas`;
 *   - os vínculos apontam para quem existe; ninguém é filho e irmão ao mesmo tempo;
 *   - o save reabre igual;
 *   - a Linha da Vida nova não contém a biografia de quem morreu;
 *   - a linhagem cresce uma geração.
 */

import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { interpretar } from '../../src/motor/save';
import { balanco } from '../../src/motor/sistemas/dinheiro';
import { calcularHeranca } from '../../src/motor/sistemas/partilha';
import { continuarComo, decidirHeranca, economiasEstimadas, encerrarHistoria, partilhar, partilhaFecha, sucessores } from '../../src/motor/sistemas/sucessao';
import type { DecisoesDeHeranca, Vida } from '../../src/motor/tipos';
import { criarRng } from '../../src/motor/rng';
import { criarPessoa, vincular } from '../../src/motor/pessoas';
import { garantirVida } from '../../src/motor/sistemas/filhos';

const FAMILIAS = Number(process.env.FAMILIAS ?? 30);
const GERACOES = Number(process.env.GERACOES ?? 3);

function responder(v: Vida): Vida {
  for (let k = 0; k < 12 && v.momento && !v.morte; k++) {
    const op = v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0];
    v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida;
  }
  return v;
}

/**
 * Andaime da simulação (não é regra do jogo): a vida que chega aos 30 sem
 * filhos ganha uma parceria e dois filhos, para que haja de quem continuar.
 * O agente "primeira opção" quase nunca namora; sem isto, a simulação mediria
 * só vidas sem descendentes.
 */
function garantirFamilia(v: Vida): Vida {
  if (idade(v) !== 30 || Object.values(v.vinculos).some(x => x.parentesco === 'filho')) return v;
  const n = structuredClone(v);
  const r = criarRng(n.seq + 99);
  const par = criarPessoa(n, r, { idade: 31, genero: n.eu.genero === 'feminino' ? 'masculino' : 'feminino', municipioId: n.moradia.municipioId });
  const vp = vincular(n, par, { origem: 'romance', proximidade: 80, convivio: ['casa'] });
  vp.romance = { estagio: 'casamento', tEstagio: n.t - 36, tInicio: n.t - 60, envolvimento: 80 };
  n.fatos[`uniao_${par.id}`] = n.t - 36;
  n.fatos[`patrimonio_uniao_${par.id}`] = Math.max(0, balanco(n).liquido);
  for (const k of [3, 1]) {
    const g = r.chance(0.5) ? 'masculino' : 'feminino';
    const f = criarPessoa(n, r, { idade: k, genero: g, municipioId: n.moradia.municipioId, sobrenome: n.eu.sobrenome });
    f.genitores = ['eu', par.id];
    vincular(n, f, { parentesco: 'filho', origem: 'familia', proximidade: 85, convivio: ['casa'] }).tInicio = f.tNasc;
    garantirVida(f);
  }
  return n;
}

function viverAteMorrer(v: Vida, limite = 95): Vida {
  while (!v.morte && idade(v) < limite) { v = garantirFamilia(responder(avancarAno(v).vida)); }
  if (!v.morte) v = { ...structuredClone(v), morte: { t: v.t, causa: 'velhice', heranca: calcularHeranca(v) } };
  return v;
}

function patrimonioTotal(v: Vida): number {
  const npcs = Object.values(v.pessoas).reduce((s, p) => s + (p.posses ? p.posses.dinheiro + p.posses.bens.reduce((t, b) => t + b.valor, 0) : 0), 0);
  return balanco(v).liquido + npcs + (v.origem.reservaDe ? v.origem.reserva ?? 0 : 0);
}

const problemas: string[] = [];
const contagem = { familias: 0, sucessoes: 0, encerradas: 0, semFilhos: 0, menores: 0, geracoesMax: 0, comCasaHerdada: 0, doacoes: 0, insolventes: 0 };
const idadesSucessor: number[] = [];

for (let f = 0; f < FAMILIAS; f++) {
  contagem.familias++;
  let v = criarVida({ nome: 'Fundador', sobrenome: 'Teste', genero: f % 2 ? 'masculino' : 'feminino', municipioId: ['recife-pe', 'sao-paulo-sp', 'porto-alegre-rs', 'belem-pa'][f % 4], semente: 9000 + f });
  for (let g = 0; g < GERACOES; g++) {
    v = viverAteMorrer(v);
    const lista = sucessores(v).filter(s => s.pode);
    if (!lista.length) {
      contagem.semFilhos++;
      const r = encerrarHistoria(v);
      if (r.erro) problemas.push(`f${f} g${g}: encerrar: ${r.erro}`);
      contagem.encerradas++;
      break;
    }
    const escolhido = lista[Math.floor(lista.length / 2)];
    // A partilha varia: lei · testamento para quem segue · doação de metade da disponível.
    const tipo = (f + g) % 3;
    const d: DecisoesDeHeranca = tipo === 1 ? { disponivel: [{ pessoaId: escolhido.pessoa.id, fracao: 1 }] } : tipo === 2 ? { doacao: { fracao: 0.5, destino: 'educacao' } } : {};
    let morta = decidirHeranca(v, d);
    let p = partilhar(morta, morta.morte!.decisoes);
    if (p.erros.length) { morta = decidirHeranca(v, {}); p = partilhar(morta, {}); }
    if (!partilhaFecha(p)) problemas.push(`f${f} g${g}: a partilha não fecha`);
    if (p.naoCoberto > 0) { contagem.insolventes++; if (process.env.DIAG) console.log(`insolvente f${f} g${g} idade ${idade(morta)}: bruto ${p.bruto}, dívidas ${p.dividas} —`, morta.financas.dividas.map(x => `${x.tipo}:${Math.round(x.saldo)}`).join(' '), `conta ${Math.round(morta.financas.conta)}`, `aluguel atrasado ${(morta.moradia.atraso ?? 0)}`); }
    if (p.doacao) contagem.doacoes++;
    const antes = patrimonioTotal(morta);
    const ids = new Set(Object.keys(morta.pessoas));
    const r = continuarComo(morta, escolhido.pessoa.id);
    if (r.erro) { problemas.push(`f${f} g${g}: continuar: ${r.erro}`); break; }
    const n = r.vida;
    contagem.sucessoes++;
    idadesSucessor.push(idade(n));
    if (idade(n) < 18) contagem.menores++;
    if (n.moradia.tipo === 'propria' && n.financas.bens.some(b => b.id === n.moradia.imovelId && b.tipo === 'imovel' && b.herdado)) contagem.comCasaHerdada++;
    // Conservação: o patrimônio que estava nas pessoas do mundo continua; o espólio (líquido) chega inteiro, menos custos,
    // doação e vacância; as economias que só agora passam a ser contadas (saves sem posses) entram uma vez.
    const npcsAntes = antes - balanco(morta).liquido;
    const economias = Object.values(n.pessoas).reduce((s, x) => s + (x.posses?.historia.filter(h => h.texto.startsWith('Economias') && h.t === morta.t).reduce((t, h) => t + h.valor, 0) ?? 0), 0);
    const ecoHerdeira = escolhido.pessoa.posses ? 0 : economiasEstimadas(morta, escolhido.pessoa);
    const depois = patrimonioTotal(n);
    const esperado = npcsAntes + p.liquido - p.custos - (p.doacao?.valor ?? 0) - p.vacante + economias + ecoHerdeira;
    if (Math.abs(depois - esperado) > 2) problemas.push(`f${f} g${g}: conservação: depois ${depois}, esperado ${esperado} (dif ${depois - esperado})`);
    // Bens com um dono só.
    const donos = new Map<string, number>();
    for (const b of n.financas.bens) donos.set(b.id, (donos.get(b.id) ?? 0) + 1);
    for (const x of Object.values(n.pessoas)) for (const b of x.posses?.bens ?? []) donos.set(b.id, (donos.get(b.id) ?? 0) + 1);
    for (const [id, k] of donos) if (k > 1) problemas.push(`f${f} g${g}: bem ${id} com ${k} donos`);
    if (n.pessoas[escolhido.pessoa.id]) problemas.push(`f${f} g${g}: a herdeira continua em pessoas`);
    for (const id of Object.keys(n.vinculos)) if (!n.pessoas[id]) problemas.push(`f${f} g${g}: vínculo para pessoa inexistente ${id}`);
    for (const id of Object.keys(n.pessoas)) if (!ids.has(id) && !n.linhagem!.geracoes.some(x => x.pessoaId === id)) problemas.push(`f${f} g${g}: pessoa nova inventada ${id}`);
    const filhos = Object.values(n.vinculos).filter(x => x.parentesco === 'filho').map(x => x.pessoaId);
    const irmaos = Object.values(n.vinculos).filter(x => x.parentesco === 'irmao' || x.parentesco === 'meio_irmao').map(x => x.pessoaId);
    if (filhos.some(x => irmaos.includes(x))) problemas.push(`f${f} g${g}: alguém é filho e irmão`);
    const bioMorto = new Set(morta.biografia.filter(e => e.relevancia === 'marco').map(e => e.texto));
    const importadas = n.biografia.filter(e => bioMorto.has(e.texto));
    if (importadas.length) problemas.push(`f${f} g${g}: ${importadas.length} linhas da biografia de quem morreu na Linha da Vida nova (${importadas[0].texto})`);
    if (n.linhagem!.geracoes.length !== g + 1) problemas.push(`f${f} g${g}: linhagem com ${n.linhagem!.geracoes.length} gerações`);
    const relido = interpretar(JSON.stringify(n));
    if (relido.tipo !== 'ok') problemas.push(`f${f} g${g}: save: ${relido.tipo === 'invalido' ? relido.motivo : relido.tipo}`);
    else if (JSON.stringify(relido.vida) !== JSON.stringify(n)) problemas.push(`f${f} g${g}: o save não reabre igual`);
    contagem.geracoesMax = Math.max(contagem.geracoesMax, g + 2);
    v = n;
    // A vida nova anda: o primeiro ano dela não pode quebrar.
    const ano = avancarAno(responder(v));
    if (ano.aviso && !v.momento) problemas.push(`f${f} g${g}: o primeiro ano não andou: ${ano.aviso.texto}`);
  }
}

const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
console.log(JSON.stringify({ ...contagem, idadeSucessorMediana: med(idadesSucessor), idadeSucessorMin: Math.min(...idadesSucessor), idadeSucessorMax: Math.max(...idadesSucessor) }, null, 1));
console.log(`problemas: ${problemas.length}`);
for (const p of problemas.slice(0, 40)) console.log(' -', p);
