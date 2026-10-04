/**
 * AUDITORIA DE VAZAMENTO BRASIL → MUNDO (fechamento do ATT Mundo, Parte 29).
 *
 *   npx esbuild scripts/sim/vazamentos.ts --bundle --platform=node --outfile=/tmp/vaz.cjs && VIDAS=3 node /tmp/vaz.cjs
 *
 * Vidas inteiras (nascer → morrer) em países que NÃO são o Brasil, de quem
 * nunca morou no Brasil. Coleta todo texto que o motor produz para essa vida
 * — biografia, histórias com as pessoas, os momentos (título, texto, opções
 * e bloqueios), os motivos dos vereditos de dezenas de ações em várias
 * idades, as descrições das atividades do Tempo livre, a carteira de
 * motorista, o exame de ingresso — e procura instituições, regras, moeda,
 * serviços e costumes brasileiros. Cada ocorrência é um vazamento: o texto e
 * o ano vão para o relatório, para achar a fonte.
 *
 * Uma segunda parte faz a trajetória de quem nasce no Brasil e migra: o que
 * a vida escreveu DEPOIS da mudança também não pode falar do Brasil como se
 * fosse o lugar (o passado brasileiro continua na história — é história).
 */

import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { cidadesDoPais, sortearMunicipio } from '../../src/motor/dados/lugares';
import { sortearNome, sortearSobrenome } from '../../src/motor/dados/nomes';
import { criarRng, type Rng } from '../../src/motor/rng';
import { entrarNaVida, educacaoDaVida, paisDaVida } from '../../src/motor/mundo/vida';
import { podeTentar } from '../../src/motor/plausibilidade';
import { ROTINAS, descricaoDaRotina, atividadeExiste } from '../../src/motor/sistemas/rotinas';
import { habilitacaoDaVida } from '../../src/motor/sistemas/autoescola';
import type { Vida } from '../../src/motor/tipos';
import { estrategia } from './estrategias';

const VIDAS = Number(process.env.VIDAS ?? 3);
const PAISES = (process.env.PAISES ?? 'US,AR,MX,PT,DE,NG,ZA,IN,JP,AU').split(',');
const PERFIS = ['familiar', 'ambicioso', 'estudioso', 'economico'];

/**
 * Os termos que denunciam o Brasil no lugar errado. Cada um é uma instituição,
 * regra, serviço, moeda ou costume brasileiro — sem justificativa numa vida
 * que nunca morou no Brasil.
 */
const TERMOS: [RegExp, string][] = [
  [/\bSESC\b|\bSENAI\b|\bSENAC\b|Sistema S\b/, 'Sistema S'],
  [/\bSUS\b|\bUBS\b|\bUPA\b|\bCAPS\b|\bCAPSi\b/, 'saúde pública brasileira'],
  [/\bENEM\b|\bSISU\b|ProUni|\bFIES\b|vestibular/i, 'ingresso na universidade (Brasil)'],
  [/\bCNH\b|Detran|Permissão para Dirigir/, 'carteira de motorista (Brasil)'],
  [/\bCLT\b|\bFGTS\b|13º|décimo terceiro|\bINSS\b|\bMEI\b|\bCNPJ\b|carteira assinada|[Jj]ovem aprendiz/, 'trabalho e previdência (Brasil)'],
  [/\bPix\b|Serasa|nome sujo|cartório|\bIPTU\b|\bIPVA\b|consignado/, 'dinheiro e cartório (Brasil)'],
  [/\bTSE\b|título de eleitor|Ficha Limpa|\bCF, art\./, 'eleições (Brasil)'],
  [/Polícia Militar|\bPRF\b|Polícia Federal|Conselho Tutelar|\bECA\b|socioeducativ/, 'polícia e justiça (Brasil)'],
  [/\bOAB\b|\bCRM\b|\bCOREN\b|\bCREA\b|\bCRC\b|\bCRP\b|\bCRO\b|\bCRECI\b|IBAMA|Lei 9\.605/, 'conselhos e órgãos (Brasil)'],
  [/instituto federal|\bEJA\b|supletivo|escola estadual|OBMEP/i, 'escola (Brasil)'],
  [/Série A|Série B|Brasileirão|campeonato estadual|\bNBB\b|Superliga|[Ss]eleção [Bb]rasileira|várzea/, 'esporte (Brasil)'],
  [/festa junina|São João|carnaval|réveillon|novela|feijoada|brigadeiro|farofa|paçoca|capoeira|forró|cavaquinho|Sete de Setembro|laje\b/i, 'costumes (Brasil)'],
  [/\bR\$|\breais\b|\breal brasileiro/, 'moeda (Brasil)'],
  [/\bBrasília\b|no Brasil\b|brasileir/, 'o Brasil como lugar'],
  // FIX pós-playtest humano: os brasileirismos INVISÍVEIS (a matéria, o cotidiano) — só onde a língua não é o português.
  [/portugu[eê]s e redação|professora? de [Pp]ortugu[eê]s|em [Pp]ortugu[eê]s|se vira em português/, 'matéria em português fora de país lusófono'],
  [/\bmerenda\b|\bpelada\b|campinho|feijão com arroz|\bchurrasco\b/i, 'cotidiano brasileiro (merenda, pelada, churrasco)'],
  [/Mecânica, Eletrotécnica e Administração/, 'o trio da escola técnica'],
  [/\bNR-\d+/, 'norma regulamentadora (Brasil)']
];
/** O que só é vazamento fora dos países de língua portuguesa. */
const SO_FORA_DO_PORTUGUES = new Set(['matéria em português fora de país lusófono']);
const LUSOFONOS = new Set(['BR', 'PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL']);

interface Achado { pais: string; vida: string; idade: number; fonte: string; termo: string; texto: string }
const achados: Achado[] = [];
const idadesFinais: number[] = [];
let foramParaOBrasil = 0;
const vistos = new Set<string>();

function procurar(pais: string, vida: string, i: number, fonte: string, texto: string | undefined): void {
  if (!texto) return;
  for (const [re, termo] of TERMOS) {
    if (!re.test(texto)) continue;
    if (SO_FORA_DO_PORTUGUES.has(termo) && LUSOFONOS.has(pais)) continue;
    const chave = `${termo}|${texto}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    achados.push({ pais, vida, idade: i, fonte, termo, texto: texto.slice(0, 220) });
  }
}

/** As ações cujos vereditos (o motivo) aparecem na tela — perguntadas em várias idades. */
const ACOES: Acao[] = [
  { tipo: 'cnh' }, { tipo: 'enem' }, { tipo: 'largar_escola' }, { tipo: 'voltar_a_estudar' }, { tipo: 'cuidar_da_casa' } as unknown as Acao,
  { tipo: 'mei' } as unknown as Acao, { tipo: 'migrar' } as unknown as Acao, { tipo: 'politica', oque: 'filiar' } as unknown as Acao,
  { tipo: 'politica', oque: 'aproximar' } as unknown as Acao, { tipo: 'emprestimo', valor: 5000, meses: 24 } as unknown as Acao,
  { tipo: 'rotina', id: 'cursinho', ativa: true, nivel: 1 }, { tipo: 'rotina', id: 'estudar_concurso', ativa: true, nivel: 1 },
  { tipo: 'rotina', id: 'sair_noite', ativa: true, nivel: 1 }, { tipo: 'rotina', id: 'terapia', ativa: true, nivel: 1 }
];

function varrerEstado(pais: string, nome: string, v: Vida): void {
  entrarNaVida(v);
  const i = idade(v);
  for (const a of ACOES) { try { procurar(pais, nome, i, `veredito ${a.tipo}${(a as { oque?: string; id?: string }).oque ?? (a as { id?: string }).id ?? ''}`, disponibilidade(v, a).motivo); } catch { /* ação sem sentido aqui */ } }
  for (const m of ROTINAS) if (atividadeExiste(v, m)) procurar(pais, nome, i, `atividade ${m.id}`, `${m.nome}: ${descricaoDaRotina(v, m)}`);
  const h = habilitacaoDaVida(v);
  procurar(pais, nome, i, 'carteira', `${h.a} · ${h.escola} · ${h.frase}`);
  const ed = educacaoDaVida(v);
  procurar(pais, nome, i, 'exame', `${ed.acao} · ${ed.via.sisu} · ${ed.via.prouni} · ${ed.via.fies}`);
}

function viver(pais: string, k: number): void {
  const r = criarRng(9000 + k * 7919 + pais.charCodeAt(0) * 31 + pais.charCodeAt(1));
  const m = sortearMunicipio(() => r.next(), pais);
  const g = r.chance(0.5) ? 'masculino' : 'feminino';
  const e = estrategia(PERFIS[k % PERFIS.length]);
  const nome = `${pais}#${k}`;
  let v = criarVida({ nome: sortearNome(r, g, 2026, pais, m.uf), sobrenome: sortearSobrenome(r, pais, m.uf), genero: g, municipioId: m.id, semente: 7000 + k * 104729 + pais.charCodeAt(1) * 13 });
  const responder = () => {
    for (let n = 0; n < 12 && v.momento && !v.morte; n++) {
      const mo = v.momento!;
      procurar(pais, nome, idade(v), `momento ${mo.situacaoId}`, `${mo.titulo} — ${mo.texto} — ${mo.opcoes.map(o => `${o.texto}${o.bloqueio ? ` [${o.bloqueio}]` : ''}${o.detalhe ? ` (${o.detalhe})` : ''}`).join(' | ')}`);
      const res = executar(v, { tipo: 'decidir', opcaoId: e.decidir(v, mo, r) });
      v = res.vida;
      procurar(pais, nome, idade(v), `resultado ${mo.situacaoId}`, res.resultado);
    }
  };
  while (!v.morte && idade(v) < 95) {
    if (paisDaVida(v) === 'BR') break; // quem foi morar no Brasil sai da amostra (o Brasil ali é o lugar)
    for (const a of e.agir(v, r)) {
      if (!podeTentar(disponibilidade(v, a))) continue;
      const res = executar(v, a);
      v = res.vida;
      procurar(pais, nome, idade(v), `ação ${a.tipo}`, res.resultado);
      responder();
    }
    if ([6, 12, 15, 16, 17, 18, 21, 25, 35, 50, 65].includes(idade(v))) varrerEstado(pais, nome, v);
    v = avancarAno(v).vida;
    responder();
  }
  idadesFinais.push(idade(v));
  if (paisDaVida(v) === 'BR') { foramParaOBrasil++; return; }
  for (const b of v.biografia) procurar(pais, nome, Math.floor((b.t - v.eu.tNasc) / 12), 'biografia', b.texto);
  for (const vin of Object.values(v.vinculos)) for (const h of vin.historia) procurar(pais, nome, Math.floor((h.t - v.eu.tNasc) / 12), 'história', h.texto);
}

async function main() {
  const falhas = await carregarMundo();
  if (falhas.length) throw new Error(`regiões que não carregaram: ${falhas}`);
  for (const p of PAISES) {
    if (!cidadesDoPais(p).length) { console.log(`${p}: sem cidades`); continue; }
    for (let k = 0; k < VIDAS; k++) viver(p, k);
  }
  const porTermo = new Map<string, Achado[]>();
  for (const a of achados) porTermo.set(a.termo, [...(porTermo.get(a.termo) ?? []), a]);
  console.log(`\n${PAISES.length} países × ${VIDAS} vidas (idade final média ${Math.round(idadesFinais.reduce((a, b) => a + b, 0) / Math.max(1, idadesFinais.length))}) · ${foramParaOBrasil} foram morar no Brasil (fora da amostra) · ${achados.length} achados distintos\n`);
  for (const [termo, xs] of porTermo) {
    console.log(`== ${termo} (${xs.length})`);
    for (const a of xs.slice(0, 25)) console.log(`  [${a.pais} ${a.idade}a · ${a.fonte}] ${a.texto}`);
  }
}

main();
