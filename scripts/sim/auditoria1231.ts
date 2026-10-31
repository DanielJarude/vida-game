/**
 * AUDITORIA 12.3.1 — simulador de auditoria (só leitura do motor: nada no jogo é alterado).
 * Mede, com sementes fixas, os 14 cenários pedidos. Os cenários que o motor não tem não são simulados: são contados como
 * lacunas no relatório.
 *
 *   npx esbuild scripts/sim/auditoria1231.ts --bundle --platform=node --format=esm --outfile=<scratch>/a.mjs && N=24 ANOS=20 node <scratch>/a.mjs
 *   (SO=acesso,contratante,orgs,recomeco e POLS=integrante,lider,... escolhem as partes)
 */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto, pessoaNova, comParceiro, comParente } from '../../src/motor/__tests__/cenarios';
import { nova, viverAte } from '../../src/motor/__tests__/ajuda';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { entrar } from '../../src/motor/sistemas/ilicito';
import { criarContato } from '../../src/motor/sistemas/submundo';
import { abertas } from '../../src/motor/sistemas/encomendas';
import { orgsDaCidade, relacaoCom, garantirCidade, nivelDe, orgViva, estadoEntre, orgsDoMundo } from '../../src/motor/sistemas/faccoes';
import { leituraDaFamilia } from '../../src/motor/sistemas/carreiraCriminal';
import { intermediario, alvosPossiveis, SERVICOS, type TipoDeServico } from '../../src/motor/sistemas/servicosPorFora';
import { prender } from '../../src/motor/sistemas/justica';
import { mudarAgora } from '../../src/motor/sistemas/processos';
import { interpretar } from '../../src/motor/save';
import { capitalDoPais } from '../../src/motor/dados/lugares';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { criarRng } from '../../src/motor/rng';
import { transacao, idade } from '../../src/motor/nucleo';
import { vincular } from '../../src/motor/pessoas';
import type { Vida } from '../../src/motor/tipos';

await carregarMundo();
const N = Number(process.env.N ?? 20);
const SO = process.env.SO?.split(',');
const quer = (k: string) => !SO || SO.includes(k);
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');
const tenta = (v: Vida, a: Acao): Vida => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);
const crime = (v: Vida, acao: unknown): Vida => tenta(v, { tipo: 'crime', acao } as Acao);
const textos = (v: Vida, desde: number) => v.biografia.filter(b => b.t >= desde).map(b => b.texto);
const out: string[] = [];
const log = (s: string) => { out.push(s); console.log(s); };

/** Responde às perguntas do ano com uma política simples (a "legal" recusa tudo do crime; a "crime" segue). */
function responder(v: Vida, pol: 'legal' | 'crime' | 'pacifico' | 'firme', cenas?: Map<string, number>): Vida {
  for (let i = 0; i < 16 && v.momento && !v.morte; i++) {
    const mo = v.momento!;
    const id = mo.situacaoId;
    if (cenas) cenas.set(id, (cenas.get(id) ?? 0) + 1);
    const livre = (x: string) => mo.opcoes.find(o => o.id === x && !o.bloqueio);
    let op;
    if (id === 'sub125_rivalidade') op = pol === 'firme' ? livre('firme') : livre('tregua');
    else if (id === 'jus_defesa') op = livre('manter') ?? livre('particular') ?? livre('publica');
    else if (id === 'jus_recurso') op = livre('recorrer');
    else if (id === 'ilic_rumo') op = pol === 'legal' ? livre('parar_esquema') : livre('seguir_esquema');
    else if (id === 'ilic_proposta') op = pol === 'legal' ? livre('recusar_proposta') : undefined;
    else if (id === 'sub125_disputa') op = livre('apoiar_1') ?? livre('neutro');
    else if (id === 'pri_rotina') op = livre('os_dois') ?? livre('estudar');
    else if (pol !== 'legal' && /^(sub|ilic_|subo|subc|subf|subd|subx)/.test(id)) op = mo.opcoes.find(o => !o.bloqueio && !/parar|largar|sair|recusar|denunciar|ajuda|mudar|sumir|cortar|cooperar|entregar|negar/.test(o.id));
    op ??= ['recusar', 'recusar_proposta', 'neutro', 'manter', 'esperar', 'seguir', 'ouvir'].map(livre).find(Boolean) ?? mo.opcoes.find(o => !o.bloqueio) ?? mo.opcoes[0];
    v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida;
  }
  return v;
}

/* =============================================================== 0. acesso natural ao contratante (vida comum) */
if (quer('acesso')) {
  log('\n## 0. Acesso natural aos pedidos por fora (vidas comuns, nascidas e vividas pelo motor)');
  const quem: Record<string, number> = {};
  let comInter = [0, 0, 0], comAlvo = [0, 0, 0], comAmbos = [0, 0, 0], vidas = 0, envolvidos = 0;
  const idades = [25, 35, 45];
  for (let s = 0; s < N; s++) {
    let v = nova({ semente: 500 + s * 13, municipioId: s % 2 ? 'sao-paulo-sp' : 'recife-pe' });
    let vivo = true;
    for (let k = 0; k < idades.length; k++) {
      v = viverAte(v, idades[k]);
      if (v.morte) { vivo = false; break; }
      const ip = intermediario(v);
      const i = !!ip, a = alvosPossiveis(v).length > 0;
      if (ip) { const vin = v.vinculos[ip.id]; const k2 = vin?.parentesco ?? (vin?.romance ? 'parceiro' : vin?.estagio ?? 'outro'); quem[k2] = (quem[k2] ?? 0) + 1; }
      comInter[k] += i ? 1 : 0; comAlvo[k] += a ? 1 : 0; comAmbos[k] += i && a ? 1 : 0;
    }
    if (vivo) vidas++;
    if (v.caminhos.envolvimento) envolvidos++;
  }
  idades.forEach((x, k) => log(`- aos ${x}: com intermediário ${pct(comInter[k], N)} · com alguém em conflito (tensão ≥ 45) ${pct(comAlvo[k], N)} · os dois ${pct(comAmbos[k], N)}`));
  log(`- quem seria o intermediário (todas as idades): ${JSON.stringify(quem)}`);
  log(`- vidas que entraram no caminho por conta própria até os 45: ${envolvidos}/${N}`);
}

/* =============================================================== 1. contratante ocasional */
function legalComIntermediario(s: number): { v: Vida; alvo: string; inter: string } {
  let v = adulto(32, { semente: 900 + s * 17, municipioId: 'sao-paulo-sp' });
  v.trabalho.atual = undefined;
  contratar(v, criarRng(s), ocupacao('assistente_adm'));
  v.financas.conta = 80000; v.financas.dividas = []; v.financas.negativado = false; v.justica = undefined; v.caminhos.envolvimento = undefined;
  const r = transacao(v, x => {
    const inter = pessoaNova(x, 34, 'masculino');
    inter.temperamento.responsabilidade = -0.6;
    vincular(x, inter, { origem: 'apresentado', proximidade: 55, estagio: 'amigo' as never });
    x.vinculos[inter.id].confianca = 55;
    const alvo = pessoaNova(x, 40, 'masculino');
    vincular(x, alvo, { origem: 'trabalho', proximidade: 30 });
    x.vinculos[alvo.id].tensao = 70;
    x.fatos['_inter'] = 0; (x as unknown as Record<string, unknown>)['_ids'] = [inter.id, alvo.id];
  }).vida;
  const [inter, alvo] = (r as unknown as Record<string, string[]>)['_ids'];
  delete (r as unknown as Record<string, unknown>)['_ids'];
  comParceiro(r, { estagio: 'casamento' });
  return { v: r, alvo, inter };
}
if (quer('contratante')) {
  log('\n## 1. Contratante ocasional (vida legal, um intermediário e um desafeto montados; 10 anos depois do pedido)');
  for (const tipo of Object.keys(SERVICOS) as TipoDeServico[]) {
    const c = { feito: 0, falhou: 0, golpe: 0, envolvimento: 0, orgs: 0, descoberto: 0, processo: 0, condenado: 0, preso: 0, perdeuEmprego: 0, empregadoNoFim: 0, saveOk: 0, alvoMorreu: 0, investigado: 0, bloqueado: 0 };
    for (let s = 0; s < N; s++) {
      const { v: v0, alvo } = legalComIntermediario(s);
      const a = { tipo: 'crime', acao: { area: 'servico', tipo, alvoId: SERVICOS[tipo].contraAlguem ? alvo : undefined } } as Acao;
      const d = disponibilidade(v0, a);
      if (!podeTentar(d)) { c.bloqueado++; continue; }
      let v = executar(v0, a).vida;
      const reg = v.caminhos.contratante!.servicos.at(-1)!;
      c[reg.resultado]++;
      const empInicial = v.trabalho.atual?.empregador;
      const t0 = v.t;
      for (let ano = 0; ano < 10 && !v.morte; ano++) v = responder(avancarAno(v).vida, 'legal');
      if (textos(v, t0).some(t => /resposta foi a demissão/.test(t))) c.perdeuEmprego++;
      if (v.caminhos.envolvimento) c.envolvimento++;
      if (v.caminhos.envolvimento?.organizacoes?.length) c.orgs++;
      if (v.caminhos.contratante?.servicos.some(x => x.descoberto !== undefined)) c.descoberto++;
      const ant = v.justica?.antecedentes ?? [];
      if (ant.length || v.justica?.processo) c.processo++;
      if (ant.some(x => x.desfecho !== 'absolvicao')) c.condenado++;
      if (ant.some(x => x.desfecho === 'prisao')) c.preso++;
      if (v.trabalho.atual && v.trabalho.atual.empregador === empInicial) c.empregadoNoFim++;
      if (alvo && v.pessoas[alvo] && !v.pessoas[alvo].vivo) c.alvoMorreu++;
      const rt = interpretar(JSON.stringify(v));
      if (rt.tipo === 'ok' && JSON.stringify(rt.vida.caminhos.contratante) === JSON.stringify(v.caminhos.contratante)) c.saveOk++;
    }
    const n = N - c.bloqueado;
    log(`- ${tipo}: bloqueado ${c.bloqueado} · feito ${c.feito} / falhou ${c.falhou} / golpe ${c.golpe} · veio à tona ${c.descoberto} · processo ${c.processo} · condenado ${c.condenado} (prisão ${c.preso}) · justa causa ${c.perdeuEmprego} · no mesmo emprego após 10 anos ${pct(c.empregadoNoFim, n)} · virou do meio ${c.envolvimento} · org ${c.orgs} · save ida-e-volta ${c.saveOk}/${n}`);
  }
}

/* =============================================================== 2–10. trajetórias dentro de uma organização */
type Pol = 'integrante' | 'lider' | 'pacifico' | 'firme' | 'sair' | 'mudar_pais' | 'mudar_estado';
function membro(s: number, pol: Pol): Vida {
  let v = adulto(26, { semente: 3000 + s * 31, municipioId: s % 3 === 0 ? 'rio-de-janeiro-rj' : 'sao-paulo-sp' });
  v.trabalho.atual = undefined;
  contratar(v, criarRng(s), ocupacao('assistente_adm'));
  v.financas.dividas = []; v.financas.negativado = false; v.momento = null; delete v.fila;
  v.financas.conta = pol === 'lider' ? 600_000 : 40_000;
  v.justica = undefined; v.caminhos.envolvimento = undefined;
  comParceiro(v, { estagio: 'casamento' });
  comParente(v, 'mae', 55, 'feminino', 70);
  return transacao(v, (x, r) => {
    entrar(x, 'grupo', undefined, r);
    criarContato(x, 'organizado', 'chefe');
    criarContato(x, 'organizado', 'parceiro');
    garantirCidade(x);
    const o = orgsDaCidade(x).find(z => z.ramo === 'organizado')!;
    const rel = relacaoCom(x, o);
    if (pol === 'lider') { rel.relacao = 'membro'; rel.nivel = 4; rel.lealdade = 65; x.caminhos.envolvimento!.reputacao = 65; }
    else { rel.relacao = 'aliada'; rel.lealdade = 50; }
  }).vida;
}

if (quer('orgs')) {
  const ANOS = Number(process.env.ANOS ?? 20);
  for (const pol of (process.env.POLS?.split(',') ?? ['integrante', 'lider', 'pacifico', 'firme', 'sair', 'mudar_pais', 'mudar_estado']) as Pol[]) {
    const m = {
      vidas: 0, entrou: 0, anosAteEntrar: [] as number[], chegou3: 0, chegou4: 0, chegou6: 0, expulso: 0, rebaixado: 0,
      anosOrgEmConflito: 0, anosMembro: 0, cenaRivalidade: 0, conflitoAberto: 0, trégua: 0,
      feridoCrime: 0, prontoSocorro: 0, saudeMin: [] as number[], morreu: 0, causas: [] as string[],
      contatoPreso: 0, contatoFalou: 0, operacaoNaOrg: 0, operacaoQueAtingiuJogador: 0,
      invest: 0, processos: 0, prisao: 0, absolv: 0, alternativa: 0,
      saiuNegociado: 0, saiuMal: 0, pressaoDepois: 0, investDepoisDeSair: 0,
      distancia: [] as string[], parteDepoisDeMudar: 0, lealdadeDepois: [] as number[],
      familiaSabe: 0, familiaRejeita: 0, parceiroTerminou: 0, disputas: 0, rachas: 0, comandou: 0,
      cenas: new Map<string, number>(), saveOk: 0, mortesNoQuadro: 0
    };
    for (let s = 0; s < N; s++) {
      let v = membro(s, pol);
      m.vidas++;
      const par0 = Object.values(v.vinculos).find(x => x.romance)?.pessoaId;
      let entrouEm: number | undefined, saiuEm: number | undefined, mudouEm: number | undefined;
      let anyConflict = false;
      for (let a = 0; a < ANOS && !v.morte; a++) {
        const e = v.caminhos.envolvimento;
        const ativo = !!e && e.parou === undefined && !v.justica?.prisao;
        const minha = e?.organizacoes?.find(o => o.relacao === 'membro' && o.saiu === undefined && o.expulso === undefined);
        if (ativo && saiuEm === undefined) {
          for (const x of abertas(v)) { if (!x.negociada && x.gravidade >= 2) v = crime(v, { area: 'encomenda', oque: 'negociar', id: x.id }); v = crime(v, { area: 'encomenda', oque: 'aceitar', id: x.id }); }
          for (const o of orgsDaCidade(v).filter(z => v.caminhos.envolvimento?.organizacoes?.some(r => r.id === z.id))) {
            v = crime(v, { area: 'org', oque: 'filiar', orgId: o.id });
            v = crime(v, { area: 'org', oque: 'tarefa', orgId: o.id });
            v = crime(v, { area: 'org', oque: 'reuniao', orgId: o.id });
            v = crime(v, { area: 'org', oque: 'promocao', orgId: o.id });
            if (pol === 'lider') { v = crime(v, { area: 'org', oque: 'disputar', orgId: o.id }); if (o.coesao < 50) v = crime(v, { area: 'org', oque: 'mediar', orgId: o.id }); }
            if (pol === 'pacifico') for (const [bid, est] of Object.entries(o.relacoes ?? {})) if (['rivalidade', 'conflito', 'ruptura'].includes(est)) v = crime(v, { area: 'org', oque: 'tregua', orgId: o.id, alvo: bid });
          }
        }
        if (pol === 'sair' && a === 6 && minha) {
          const antes = v.caminhos.envolvimento!.organizacoes!.find(o => o.id === minha.id)!;
          v = crime(v, { area: 'org', oque: 'sair', orgId: minha.id });
          const depois = v.caminhos.envolvimento!.organizacoes!.find(o => o.id === minha.id)!;
          if (depois.saiu !== undefined) { saiuEm = v.t; if (depois.memoria.at(-1)?.fato === 'traicao') m.saiuMal++; else m.saiuNegociado++; }
          void antes;
          v = crime(v, { area: 'rumo', oque: 'sair_aos_poucos' });
        }
        if ((pol === 'mudar_pais' || pol === 'mudar_estado') && a === 6 && minha) {
          v = transacao(v, x => mudarAgora(x, pol === 'mudar_pais' ? capitalDoPais('PT')!.id : 'porto-alegre-rs', 'auditoria', { internacional: pol === 'mudar_pais', comAFamilia: true })).vida;
          mudouEm = v.t;
        }
        const ganhoAntes = v.caminhos.envolvimento?.ganhos ?? 0;
        const t0 = v.t;
        v = responder(avancarAno(v).vida, pol === 'firme' ? 'firme' : pol === 'sair' && saiuEm !== undefined ? 'legal' : 'crime', m.cenas);
        const tx = textos(v, t0);
        const e2 = v.caminhos.envolvimento;
        if (mudouEm !== undefined && v.t - mudouEm <= 36) {
          const rel = e2?.organizacoes?.find(o => o.relacao === 'membro' && o.saiu === undefined);
          if (rel) { m.distancia.push(rel.distancia ?? '?'); m.lealdadeDepois.push(rel.lealdade); }
          if ((e2?.ganhos ?? 0) > ganhoAntes) m.parteDepoisDeMudar++;
        }
        const rel = e2?.organizacoes?.find(o => o.relacao === 'membro' && o.saiu === undefined && o.expulso === undefined);
        if (rel && entrouEm === undefined) { entrouEm = a + 1; m.entrou++; m.anosAteEntrar.push(a + 1); }
        if (rel) {
          m.anosMembro++;
          const o = orgViva(v, rel.id);
          if (o) {
            const emConflito = orgsDaCidade(v, o.municipioId).some(b => b.id !== o.id && estadoEntre(o, b) === 'conflito');
            if (emConflito) { m.anosOrgEmConflito++; anyConflict = true; }
            if (o.historia.some(h => h.t > t0 - 1 && /Uma operação levou/.test(h.texto))) { m.operacaoNaOrg++; if (tx.some(t => /operação/i.test(t))) m.operacaoQueAtingiuJogador++; }
          }
        }
        if (tx.some(t => /conflito aberto — e você é de dentro/.test(t))) m.conflitoAberto++;
        if (tx.some(t => /pronto-socorro|cicatriz|machucad/.test(t))) m.prontoSocorro++;
        for (const t of tx) {
          if (/foi pres[oa]\. Ninguém sabe/.test(t)) m.contatoPreso++;
        }
        for (const d of (e2?.diario ?? []).filter(d => d.t >= t0)) { if (/foi pres[oa]\./.test(d.texto)) m.contatoPreso++; if (/falou de você/.test(d.texto)) m.contatoFalou++; }
        if (saiuEm !== undefined && v.t > saiuEm && tx.some(t => /só para conversar|quem sai deve explicações|carro parado na esquina/.test(t))) m.pressaoDepois++;
        if (saiuEm !== undefined && v.t > saiuEm && e2?.investigado !== undefined && e2.investigado >= t0) m.investDepoisDeSair++;
      }
      const e = v.caminhos.envolvimento;
      const rels = e?.organizacoes ?? [];
      if (rels.some(o => (o.nivel ?? 0) >= 2 || nivelDe(v, o) >= 2)) m.chegou3++;
      if (rels.some(o => o.relacao === 'membro' && nivelDe(v, o) >= 4)) m.chegou4++;
      if (rels.some(o => o.relacao === 'membro' && nivelDe(v, o) >= 6) || v.biografia.some(b => /Passou a comandar/.test(b.texto))) m.chegou6++;
      if (v.biografia.some(b => /Passou a comandar/.test(b.texto))) m.comandou++;
      if (rels.some(o => o.expulso !== undefined)) m.expulso++;
      if ((e?.diario ?? []).some(d => /Rebaixado/.test(d.texto))) m.rebaixado++;
      if ((e?.diario ?? []).some(d => /rachou/.test(d.texto))) m.rachas++;
      m.disputas += m.cenas.get('sub125_disputa') ? 1 : 0;
      m.cenaRivalidade += 0;
      const ant = v.justica?.antecedentes ?? [];
      m.invest += v.fatos['investigacoes'] ?? 0;
      m.processos += ant.length;
      m.prisao += ant.filter(x => x.desfecho === 'prisao').length ? 1 : 0;
      m.absolv += ant.filter(x => x.desfecho === 'absolvicao').length;
      m.alternativa += ant.filter(x => x.desfecho === 'alternativa').length;
      m.saudeMin.push(v.corpo.saude);
      if (v.morte) { m.morreu++; m.causas.push(v.morte.causa); }
      const fam = leituraDaFamilia(v);
      if (fam.some(f => f.sabe === 'sabe')) m.familiaSabe++;
      if (fam.some(f => /não aceita|pede que/.test(f.postura))) m.familiaRejeita++;
      if (par0 && !v.vinculos[par0]?.romance) m.parceiroTerminou++;
      for (const o of orgsDoMundo(v)) m.mortesNoQuadro += o.quadro.filter(q => q.estado === 'morto').length;
      const rt = interpretar(JSON.stringify(v));
      if (rt.tipo === 'ok' && JSON.stringify(rt.vida.caminhos.envolvimento) === JSON.stringify(v.caminhos.envolvimento) && JSON.stringify(rt.vida.mundoCriminal) === JSON.stringify(v.mundoCriminal)) m.saveOk++;
      void anyConflict;
    }
    const top = [...m.cenas.entries()].filter(([k]) => /^(sub|ilic|jus|pri)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => `${k} ${n}`).join(', ');
    log(`\n## perfil ${pol} (${N} vidas × ${ANOS} anos)`);
    log(`- entrou na org: ${m.entrou}/${m.vidas} (mediana ${m.anosAteEntrar.sort((a, b) => a - b)[Math.floor(m.anosAteEntrar.length / 2)] ?? '—'} anos) · posto ≥3º nível ${m.chegou3} · ≥5º ${m.chegou4} · comando ${m.chegou6} · expulso ${m.expulso} · rebaixado ${m.rebaixado} · rachas vividos ${m.rachas} · vidas com disputa ${m.disputas}`);
    log(`- anos como membro ${m.anosMembro}; com a org em conflito aberto com outra: ${m.anosOrgEmConflito} (${pct(m.anosOrgEmConflito, m.anosMembro)}) · avisos "conflito aberto — você é de dentro" ${m.conflitoAberto} · cena da rivalidade ${m.cenas.get('sub125_rivalidade') ?? 0}`);
    log(`- operações que levaram alguém do quadro da sua org: ${m.operacaoNaOrg} (com texto ao jogador no ano: ${m.operacaoQueAtingiuJogador}) · contatos presos ${m.contatoPreso}, que falaram de você ${m.contatoFalou}`);
    log(`- ferimentos/pronto-socorro do crime: ${m.prontoSocorro} anos · saúde final p50 ${m.saudeMin.sort((a, b) => a - b)[Math.floor(m.saudeMin.length / 2)]} · mortes do jogador ${m.morreu} (${m.causas.join('; ') || '—'}) · mortes no quadro das orgs (todas, por idade) ${m.mortesNoQuadro}`);
    log(`- Justiça: investigações ${m.invest} · processos ${m.processos} (absolvições ${m.absolv}, alternativas ${m.alternativa}) · vidas com prisão ${m.prisao}/${m.vidas}`);
    log(`- família: alguém sabe ${m.familiaSabe}/${m.vidas} · alguém rejeita/pede para sair ${m.familiaRejeita} · casamento terminou ${m.parceiroTerminou}`);
    if (pol === 'sair') log(`- saída da org: negociada ${m.saiuNegociado} · mal recebida ${m.saiuMal} · anos com pressão do grupo depois ${m.pressaoDepois} · investigações depois de sair ${m.investDepoisDeSair}`);
    if (pol.startsWith('mudar')) log(`- depois de mudar: distância ${JSON.stringify(m.distancia.reduce((s, x) => ({ ...s, [x]: (s[x] ?? 0) + 1 }), {} as Record<string, number>))} · anos com dinheiro entrando ${m.parteDepoisDeMudar} · lealdade p50 ${m.lealdadeDepois.sort((a, b) => a - b)[Math.floor(m.lealdadeDepois.length / 2)] ?? '—'}`);
    log(`- cenas mais vistas: ${top}`);
    log(`- save ida-e-volta (envolvimento + mundo criminal idênticos): ${m.saveOk}/${m.vidas}`);
  }
}

/* =============================================================== 14. recomeçar depois da condenação */
if (quer('recomeco')) {
  log('\n## 14. Recomeçar depois de uma condenação à prisão (4 anos de pena, sai e tenta vida legal; 15 anos)');
  let empregado5 = 0, reabil = 0, voltou = 0, n = 0, aindaPreso = 0, renda: number[] = [];
  for (let s = 0; s < N; s++) {
    let v = adulto(28, { semente: 7000 + s * 7, municipioId: 'sao-paulo-sp' });
    v.trabalho.atual = undefined; v.financas.conta = 5000; v.financas.dividas = [];
    v = transacao(v, (x, r) => { entrar(x, 'patrimonial', undefined, r); x.justica = { antecedentes: [{ t: x.t, categoria: 'patrimonial', desfecho: 'prisao', anos: 4 }] }; prender(x, x.t + 18, 'fechado', 'pena'); x.justica.prisao!.penaMeses = 48; x.caminhos.envolvimento!.parou = x.t; }).vida;
    n++;
    let livreEm: number | undefined;
    for (let a = 0; a < 15 && !v.morte; a++) {
      if (!v.justica?.prisao) {
        livreEm ??= a;
        if (!v.trabalho.atual) for (const oc of ['assistente_adm', 'atendente', 'vendedor', 'ajudante_obras']) { try { v = tenta(v, { tipo: 'candidatar', ocupacaoId: oc } as never); } catch { /* */ } }
        v = tenta(v, { tipo: 'margem', oque: 'reabilitacao' } as never);
      }
      v = responder(avancarAno(v).vida, 'legal');
      if (livreEm !== undefined && a - livreEm === 5 && v.trabalho.atual) empregado5++;
    }
    if (v.justica?.prisao) aindaPreso++;
    if (v.biografia.some(b => /reabilit/i.test(b.texto) && !/negad/i.test(b.texto))) reabil++;
    if (v.caminhos.envolvimento && v.caminhos.envolvimento.parou === undefined) voltou++;
    renda.push(v.trabalho.atual?.salario ?? 0);
  }
  renda.sort((a, b) => a - b);
  log(`- com emprego 5 anos depois de sair: ${empregado5}/${n} · reabilitação concedida (texto) ${reabil}/${n} · voltou ao crime ${voltou}/${n} · ainda preso no fim ${aindaPreso} · salário p50 no fim ${renda[Math.floor(renda.length / 2)]}`);
}

console.log('\nFIM');
