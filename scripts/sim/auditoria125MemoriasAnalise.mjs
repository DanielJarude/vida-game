/**
 * AUDITORIA 12.5 — análise das vidas gravadas por `auditoria125Memorias.ts` (OUT=<pasta>).
 * Para cada tipo de acontecimento: quantas vezes ocorreu (VERDADE, pelo estado ano a ano) e quantas têm registro
 * identificável em cada fonte do save (estrutura ou biografia), casando por tempo (±14 meses) e pessoa quando há.
 *
 *   node scripts/sim/auditoria125MemoriasAnalise.mjs <pasta> [descobrir]
 */
import { readFileSync, readdirSync } from 'node:fs';

const pasta = process.argv[2] ?? `${process.env.HOME}/vida-trabalho/a125/mem4`;
const DESCOBRIR = process.argv[3] === 'descobrir';
const vidas = readdirSync(pasta).filter(f => /^v\d+\.json$/.test(f)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
  .map(f => JSON.parse(readFileSync(`${pasta}/${f}`, 'utf8')));

const bio = (v, f) => v.biografia.filter(f).map(e => ({ t: e.t, pessoa: e.evento?.pessoaId ?? e.pessoas?.[0], pessoas: e.pessoas, texto: e.texto, rel: e.relevancia }));
const re = (rx, tema) => e => rx.test(e.texto) && (!tema || e.tema === tema);
const ev = (...tipos) => e => tipos.includes(e.evento?.tipo);
const marcas = (v, ...tipos) => v.caminhos.marcas.filter(m => tipos.includes(m.tipo)).map(m => ({ t: m.t, texto: m.texto }));
const parentes = (v, ...pars) => Object.values(v.vinculos).filter(x => pars.includes(x.parentesco)).map(x => v.pessoas[x.pessoaId]).filter(Boolean);
const empregos = v => [...v.trabalho.historico, ...(v.trabalho.atual ? [v.trabalho.atual] : [])].sort((a, b) => a.tInicio - b.tInicio);
const nascidoNaVida = (v, p) => p.tNasc > v.eu.tNasc;

/** Fontes de cada tipo: nome → (vida) → registros {t, pessoa?, texto?}. */
const FONTES = {
  nascimento: {
    'eu.tNasc + municipioNatal': v => [{ t: v.eu.tNasc }],
    'bio tema=nascimento': v => bio(v, e => e.tema === 'nascimento')
  },
  entrada_escola: {
    'bio fato.tipo=primeiro_dia': v => bio(v, e => e.fato?.tipo === 'primeiro_dia'),
    'eu.marcos.primeiro_dia_de_aula': v => (v.eu.marcos?.primeiro_dia_de_aula !== undefined ? [{ t: v.eu.marcos.primeiro_dia_de_aula }] : []),
    'educacao.historicoAcademico (1º ano fund.)': v => (v.educacao.historicoAcademico ?? []).filter(h => /^1º ano do fundamental/.test(h.rotulo)).slice(0, 1).map(h => ({ t: h.t - 12 }))
  },
  formatura_medio: {
    'bio /^Concluiu o ensino médio/': v => bio(v, re(/^Concluiu o ensino médio/)),
    'historicoAcademico 3º ano do médio': v => (v.educacao.historicoAcademico ?? []).filter(h => /3º ano do (ensino )?médio/.test(h.rotulo)).map(h => ({ t: h.t })),
    'marcas formacao': v => marcas(v, 'formacao')
  },
  formatura: {
    'educacao.concluidos (tFim,nivel,nome,inst)': v => v.educacao.concluidos.map(c => ({ t: c.tFim, texto: `${c.nivel}: ${c.nome}` })),
    'bio /^(Concluiu|Formou-se)/ tema=estudo': v => bio(v, re(/^(Concluiu|Formou-se)/, 'estudo')),
    'trajetoria tipo=formatura': v => (v.educacao.trajetoria ?? []).filter(x => x.tipo === 'formatura').map(x => ({ t: x.t, texto: x.texto })),
    'marcas formacao': v => marcas(v, 'formacao')
  },
  aprovacao_curso: {
    'bio /^Aprovad[oae] em/': v => bio(v, re(/^Aprovad[oae] (em|n)/)),
    'marcas aprovacao|ingresso': v => marcas(v, 'aprovacao', 'ingresso')
  },
  primeiro_emprego: {
    'bio /^Primeiro emprego/': v => bio(v, re(/^Primeiro emprego/)),
    'marcas primeiro_emprego': v => marcas(v, 'primeiro_emprego'),
    'trabalho.historico[0] (tInicio)': v => empregos(v).slice(0, 1).map(e => ({ t: e.tInicio, texto: e.ocupacaoId }))
  },
  novo_emprego: {
    'bio /^Novo emprego|^Passou a trabalhar/': v => bio(v, re(/^Novo emprego|^Passou a trabalhar como|^Contratad[oae]/)),
    'trabalho.historico (tInicio)': v => empregos(v).slice(1).map(e => ({ t: e.tInicio, texto: `${e.ocupacaoId} @ ${e.empregador}` }))
  },
  promocao: {
    'bio /^Promovid/': v => bio(v, re(/^Promovid/)),
    'marcas promocao': v => marcas(v, 'promocao'),
    'emprego.postos (historico+atual)': v => empregos(v).flatMap(e => (e.postos ?? []).filter(p => p.t > e.tInicio).map(p => ({ t: p.t, texto: p.ocupacaoId })))
  },
  aposentadoria: {
    'trabalho.aposentadoria.t': v => (v.trabalho.aposentadoria ? [{ t: v.trabalho.aposentadoria.t }] : []),
    'bio /^Aposentou-se/': v => bio(v, re(/^Aposentou-se|^Aposentad/)),
    'marcas aposentadoria': v => marcas(v, 'aposentadoria')
  },
  abrir_negocio: {
    'marcas negocio_aberto': v => marcas(v, 'negocio_aberto'),
    'caminhos.negocio.tInicio': v => (v.caminhos.negocio ? [{ t: v.caminhos.negocio.tInicio, texto: v.caminhos.negocio.nome }] : []),
    'bio /^Abriu/': v => bio(v, re(/^Abriu/))
  },
  abrir_empresa: {
    'financas.empresas.tInicio': v => (v.financas.empresas ?? []).map(e => ({ t: e.tInicio, texto: e.nome })),
    'bio /^Abriu/': v => bio(v, re(/^Abriu/))
  },
  primeiro_namoro: {
    'bio evento=namoro | /^Começou a namorar/': v => bio(v, e => e.evento?.tipo === 'namoro' || /^Começou a namorar|^Começaram a namorar/.test(e.texto)).slice(0, 1),
    'vinculo.historia "Começaram a namorar"': v => Object.values(v.vinculos).flatMap(x => x.historia.filter(h => /^Começaram a namorar/.test(h.texto)).map(h => ({ t: h.t, pessoa: x.pessoaId }))).sort((a, b) => a.t - b.t).slice(0, 1)
  },
  namoro: {
    'bio evento=namoro | /^Começou a namorar/': v => bio(v, e => e.evento?.tipo === 'namoro' || /^Começou a namorar|^Começaram a namorar/.test(e.texto)),
    'bio evento=namoro (só estruturado)': v => bio(v, ev('namoro'))
  },
  casamento: {
    'bio evento=casamento | /^Casou-se/': v => bio(v, e => e.evento?.tipo === 'casamento' || /^Casou-se|^Casaram-se/.test(e.texto)),
    'bio evento=casamento (só estruturado)': v => bio(v, ev('casamento')),
    'vinculo.historia tipo=casamento': v => Object.values(v.vinculos).flatMap(x => x.historia.filter(h => h.tipo === 'casamento').map(h => ({ t: h.t, pessoa: x.pessoaId })))
  },
  uniao: {
    'bio evento=uniao | /^Foi morar (junto )?com/': v => bio(v, e => e.evento?.tipo === 'uniao' || /^Foi morar (junto )?com|^Foram morar juntos/.test(e.texto)),
    'bio evento=uniao (só estruturado)': v => bio(v, ev('uniao')),
    'vinculo.historia tipo=casa': v => Object.values(v.vinculos).filter(x => x.romance).flatMap(x => x.historia.filter(h => h.tipo === 'casa').map(h => ({ t: h.t, pessoa: x.pessoaId })))
  },
  divorcio: {
    'bio evento=divorcio': v => bio(v, ev('divorcio')),
    'romance.fim=divorcio (tEstagio)': v => Object.values(v.vinculos).filter(x => x.romance?.fim === 'divorcio').map(x => ({ t: x.romance.tEstagio, pessoa: x.pessoaId }))
  },
  filho_nasceu: {
    'pessoas parentesco=filho (tNasc)': v => parentes(v, 'filho').filter(p => nascidoNaVida(v, p) && !p.especie).map(p => ({ t: p.tNasc, pessoa: p.id })),
    'bio evento=filho_nasceu': v => bio(v, ev('filho_nasceu'))
  },
  neto_nasceu: {
    'pessoas parentesco=neto (tNasc)': v => parentes(v, 'neto').map(p => ({ t: p.tNasc, pessoa: p.id })),
    'bio evento=neto_nasceu|virou_avo': v => bio(v, ev('neto_nasceu', 'virou_avo'))
  },
  morte_pai_mae: {
    'pessoas pai/mae (tMorte)': v => parentes(v, 'pai', 'mae').filter(p => !p.vivo && p.tMorte !== undefined).map(p => ({ t: p.tMorte, pessoa: p.id })),
    'bio evento=morte (pessoaId)': v => bio(v, e => e.evento?.tipo === 'morte' && e.evento.pessoaId),
    'bio evento=morte relev. marco|biografia': v => bio(v, e => e.evento?.tipo === 'morte' && e.evento.pessoaId && (e.relevancia === 'marco' || e.relevancia === 'biografia'))
  },
  morte_conjuge: {
    'romance.fim=morte + pessoa.tMorte': v => Object.values(v.vinculos).filter(x => x.romance?.fim === 'morte').map(x => ({ t: v.pessoas[x.pessoaId]?.tMorte, pessoa: x.pessoaId })),
    'bio evento=viuvez': v => bio(v, ev('viuvez'))
  },
  morte_filho: {
    'pessoas filho (tMorte)': v => parentes(v, 'filho').filter(p => !p.vivo && !p.especie).map(p => ({ t: p.tMorte, pessoa: p.id })),
    'bio evento=morte (pessoaId)': v => bio(v, e => e.evento?.tipo === 'morte' && e.evento.pessoaId)
  },
  viagem: {
    'bio /^Viajou para|^Lua de mel em/': v => bio(v, re(/^Viajou para|^Lua de mel em/)),
    'fatos exp_viagem_* (só a última)': v => ['exp_viagem_pais', 'exp_viagem_exterior'].filter(k => v.fatos[k] !== undefined).map(k => ({ t: v.fatos[k] }))
  },
  mudanca_cidade: {
    'marcas mudanca_cidade': v => marcas(v, 'mudanca_cidade'),
    'bio tema=lugar /^Mudou-se/': v => bio(v, re(/^Mudou-se|^Mudaram-se/))
  },
  mudanca_pais: {
    'mundo.migracoes': v => (v.mundo?.migracoes ?? []).map(m => ({ t: m.t, texto: `${m.de}→${m.para}` })),
    'bio tema=lugar /^Mudou-se/': v => bio(v, re(/^Mudou-se|^Mudaram-se/))
  },
  mudanca_residencia: {
    'moradia.tInicio (só a atual)': v => [{ t: v.moradia.tInicio }],
    'bio tema=casa|lugar (mudança)': v => bio(v, e => (e.tema === 'casa' || e.tema === 'lugar') && /^(Saiu de casa|Mudou|Mudaram|Alugou|Voltou a morar|Voltou para a casa|Foi morar|Comprou a primeira casa|Trocou de casa)/.test(e.texto))
  },
  compra_imovel: {
    'financas.bens imovel (tCompra; só os atuais)': v => v.financas.bens.filter(b => b.tipo === 'imovel' && !b.herdado).map(b => ({ t: b.tCompra, texto: b.nome })),
    'bio /^Comprou/ tema=casa|dinheiro': v => bio(v, e => /^Comprou/.test(e.texto) && /casa|apartamento|imóvel|terreno|sítio|kitnet|cobertura|chácara|fazenda/i.test(e.texto))
  },
  compra_veiculo: {
    'financas.bens veiculo (tCompra; só os atuais)': v => v.financas.bens.filter(b => b.tipo === 'veiculo').map(b => ({ t: b.tCompra, texto: b.nome })),
    'bio /^Comprou/ (veículo)': v => bio(v, e => /^Comprou/.test(e.texto) && /carro|moto|picape|caminhonete|bicicleta|scooter|SUV|\bum [A-Z][a-z]+ [A-Z]/.test(e.texto))
  },
  esporte_titulo: {
    'caminhos.palmares tipo=titulo': v => (v.caminhos.palmares ?? []).filter(c => c.tipo === 'titulo').map(c => ({ t: c.t, texto: c.texto })),
    'bio /campe[ãa]o|título/': v => bio(v, re(/campe[ãaõo]|título|taça/i)),
    'marcas conquista': v => marcas(v, 'conquista')
  },
  esporte_premio: {
    'caminhos.palmares tipo=premio': v => (v.caminhos.palmares ?? []).filter(c => c.tipo === 'premio').map(c => ({ t: c.t, texto: c.texto })),
    'bio /prêmio|melhor|artilheir|seleção do/': v => bio(v, re(/prêmio|melhor jogad|artilheir|seleção do|bola de/i))
  },
  esporte_selecao: {
    'caminhos.palmares tipo=selecao': v => (v.caminhos.palmares ?? []).filter(c => c.tipo === 'selecao').map(c => ({ t: c.t, texto: c.texto })),
    'bio /seleção/': v => bio(v, re(/seleção/i))
  },
  premio_artistico: {
    'caminhos.obras[].premio.venceu': v => (v.caminhos.obras ?? []).filter(o => o.premio?.venceu).map(o => ({ t: o.t, texto: `${o.titulo} — ${o.premio.nome}` })),
    'bio /prêmio|venceu/': v => bio(v, re(/prêmio|premiad|venceu o/i))
  },
  fama_marco: {
    'notoriedade.pico (sem data)': v => (v.notoriedade?.pico >= 20 ? [{ t: v.notoriedade.t, texto: `pico ${v.notoriedade.pico}` }] : []),
    'bio /conhecid|famos|reconhec/': v => bio(v, re(/conhecid[oa]s? na rua|famos|reconheceu na rua|pediu (uma )?foto|autógrafo/i))
  },
  seguidores_marco: {
    'redes.contas.seguidores (só o atual)': v => Object.values(v.redes?.contas ?? {}).filter(c => c.seguidores >= 10000).map(c => ({ t: c.tCriada })),
    'bio /seguidores/': v => bio(v, re(/seguidores|inscritos/i))
  },
  mandato: {
    'politica.historico resultado=eleito': v => (v.caminhos.politica?.historico ?? []).filter(h => h.resultado === 'eleito').map(h => ({ t: h.t, texto: h.cargo })),
    'marcas eleicao': v => marcas(v, 'eleicao'),
    'bio /^Elei|eleit[oa]/': v => bio(v, re(/^Elei|eleit[oae] |tomou posse/i))
  },
  prisao: {
    'justica.antecedentes desfecho=prisao': v => (v.justica?.antecedentes ?? []).filter(a => a.desfecho === 'prisao').map(a => ({ t: a.t })),
    'marcas prisao': v => marcas(v, 'prisao'),
    'bio /preso|presa|prisão|condenad/': v => bio(v, re(/pres[oa]\b|prisão|condenad/i))
  },
  doenca_grave: {
    'corpo.condicoes gravidade>=2 (só as atuais)': v => v.corpo.condicoes.filter(c => c.gravidade >= 2).map(c => ({ t: c.tDiagnostico ?? c.tInicio, texto: c.nome })),
    'bio tema=saude + nome da doença': v => bio(v, e => e.tema === 'saude' && /diagnóstico|diabetes|câncer|cancer|hipertens|pressão|AVC|infarto|depress|tumor|doença/i.test(e.texto))
  },
  primeira_tatuagem: {
    'eu.tatuagens[0].t': v => (v.eu.tatuagens ?? []).slice().sort((a, b) => a.t - b.t).slice(0, 1).map(x => ({ t: x.t, texto: x.desenho })),
    'bio /tatua/': v => bio(v, re(/tatua/i)).slice(0, 1)
  },
  pet: {
    'pessoas especie + pet.tChegada': v => Object.values(v.pessoas).filter(p => p.especie && p.pet && p.pet.tutor === 'eu' || p.especie && v.vinculos[p.id]).map(p => ({ t: p.pet?.tChegada ?? p.tNasc, pessoa: p.id, texto: `${p.especie} ${p.nome}` })),
    'bio /chegou: / tema=casa': v => bio(v, e => / chegou: | chegou em casa|Adotou /.test(e.texto) && e.tema === 'casa')
  }
};
// Verdade com nomes da simulação → tipo da tabela.
const ALIAS = { esporte_titulo: ['esporte_titulo'], esporte_premio: ['esporte_premio'], esporte_selecao: ['esporte_selecao'], namoro: ['namoro', 'primeiro_namoro'], morte_conjuge: ['morte_conjuge'] };

function casar(verd, regs, comPessoa) {
  const usados = new Set();
  let ok = 0;
  for (const x of verd) {
    const p = x.dados?.pessoa;
    const i = regs.findIndex((r, k) => !usados.has(k) && r.t !== undefined && Math.abs(r.t - x.t) <= 14 && (!comPessoa || !p || !r.pessoa || r.pessoa === p || r.pessoas?.includes(p)));
    if (i >= 0) { usados.add(i); ok++; }
  }
  return { ok, extras: regs.length - usados.size };
}

const tabela = [];
for (const [tipo, fontes] of Object.entries(FONTES)) {
  const tiposVerdade = ALIAS[tipo] ?? [tipo];
  let nVerd = 0;
  const porFonte = Object.fromEntries(Object.keys(fontes).map(f => [f, { ok: 0, extras: 0, regs: 0 }]));
  for (const { vida: v, verdade } of vidas) {
    const verd = verdade.filter(x => tiposVerdade.includes(x.tipo) && !(tipo === 'compra_imovel' && x.dados?.herdado));
    nVerd += verd.length;
    for (const [nome, f] of Object.entries(fontes)) {
      const regs = f(v);
      const c = casar(verd, regs, true);
      porFonte[nome].ok += c.ok; porFonte[nome].extras += c.extras; porFonte[nome].regs += regs.length;
    }
  }
  tabela.push({ tipo, nVerd, porFonte });
}

console.log(`# Memórias — ${vidas.length} vidas (${vidas.map(x => `${x.plano} ${Math.floor((x.vida.t - x.vida.eu.tNasc) / 12)}a`).join(', ')})\n`);
console.log('| acontecimento | ocorreu (estado) | fonte | registros | casados | sem par |');
console.log('|---|---:|---|---:|---:|---:|');
for (const { tipo, nVerd, porFonte } of tabela) {
  let primeira = true;
  for (const [f, c] of Object.entries(porFonte)) {
    console.log(`| ${primeira ? tipo : ''} | ${primeira ? nVerd : ''} | ${f} | ${c.regs} | ${c.ok} | ${c.extras} |`);
    primeira = false;
  }
}

// Biografia: tamanho, relevância, fato/evento.
const tot = { n: 0, rel: {}, fato: {}, evento: {}, semPessoa: 0 };
for (const { vida: v } of vidas) for (const e of v.biografia) {
  tot.n++; tot.rel[e.relevancia] = (tot.rel[e.relevancia] ?? 0) + 1;
  if (e.fato) tot.fato[e.fato.tipo] = (tot.fato[e.fato.tipo] ?? 0) + 1;
  if (e.evento) tot.evento[e.evento.tipo] = (tot.evento[e.evento.tipo] ?? 0) + 1;
}
console.log(`\nBiografia: ${tot.n} entradas (${Math.round(tot.n / vidas.length)}/vida) · relevância ${JSON.stringify(tot.rel)}`);
console.log(`fato.tipo: ${JSON.stringify(tot.fato)}`);
console.log(`evento.tipo: ${JSON.stringify(tot.evento)}`);
console.log(`caminhos.marcas por vida: ${vidas.map(x => x.vida.caminhos.marcas.length).join(', ')} (limite 80)`);
console.log(`vinculos com historia >= 30 (limite): ${vidas.reduce((s, x) => s + Object.values(x.vida.vinculos).filter(y => y.historia.length >= 30).length, 0)}`);
console.log(`trajetoria (limite 60): ${vidas.map(x => (x.vida.educacao.trajetoria ?? []).length).join(', ')}`);
const saiu = vidas.reduce((s, x) => s + x.verdade.filter(y => y.tipo === 'bem_saiu').length, 0);
console.log(`bens que saíram do patrimônio (vendidos/perdidos): ${saiu} · bens comprados (verdade): ${vidas.reduce((s, x) => s + x.verdade.filter(y => /^compra_/.test(y.tipo)).length, 0)}`);
const tamanho = vidas.map(x => JSON.stringify(x.vida.biografia).length);
console.log(`tamanho da biografia (JSON, kB): ${tamanho.map(n => Math.round(n / 1024)).join(', ')} · save inteiro: ${vidas.map(x => Math.round(JSON.stringify(x.vida).length / 1024)).join(', ')}`);

// Repetição de textos idênticos (o álbum mostraria duplicatas).
const reps = [];
for (const { plano, vida: v } of vidas) {
  const m = new Map();
  for (const e of v.biografia) if (e.relevancia === 'biografia' || e.relevancia === 'marco') m.set(e.texto, (m.get(e.texto) ?? 0) + 1);
  for (const [t, n] of m) if (n >= 4) reps.push(`${plano}: ×${n} "${t.slice(0, 110)}"`);
}
console.log(`\nTextos (marco/biografia) repetidos ≥4× na mesma vida: ${reps.length}`);
for (const r of reps.slice(0, 15)) console.log(`  ${r}`);

if (DESCOBRIR) {
  // Para cada tipo da verdade: as entradas da biografia a até 12 meses (para achar o padrão de texto).
  const porTipo = {};
  for (const { vida: v, verdade } of vidas) for (const x of verdade) {
    const perto = v.biografia.filter(e => Math.abs(e.t - x.t) <= 12 && e.relevancia !== 'tecnico').map(e => `[${e.relevancia[0]}|${e.tema}|${e.evento?.tipo ?? ''}|${e.fato?.tipo ?? ''}] ${e.texto.slice(0, 120)}`);
    (porTipo[x.tipo] ??= []).push(`${x.idade}a ${JSON.stringify(x.dados ?? {}).slice(0, 90)}\n      ${perto.join('\n      ')}`);
  }
  for (const [t, xs] of Object.entries(porTipo)) { console.log(`\n## ${t} (${xs.length})`); for (const x of xs.slice(0, Number(process.env.K ?? 3))) console.log(`  ${x}`); }
}
