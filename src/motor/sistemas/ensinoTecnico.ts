/**
 * A FORMAÇÃO TÉCNICA como catálogo contextual e persistente (FIX pós-playtest humano).
 *
 * O playtest apontou duas vezes — a segunda numa vida no Japão — a escola técnica oferecendo sempre Mecânica,
 * Eletrotécnica e Administração. A causa: um sorteio de 3 cursos de uma lista de 5, igual em todo o mundo, com nome
 * de instituto federal trocado por "escola técnica pública". Agora a ordem é a da vida:
 *
 *   país (a ROTA de formação profissional de lá: o kōsen japonês, a formação dual alemã, o lycée professionnel, o
 *   instituto federal) → cidade (quantas escolas técnicas há, e de que perfil: a cidade industrial tem a escola da
 *   indústria; a pequena, a agrícola; a do litoral, a de hotelaria) → a INSTITUIÇÃO (nome, perfil e catálogo próprios)
 *   → o curso → a formação (prática, habilidades) → a área que abre empregos (`dados/ocupacoes`, por `area`).
 *
 * A identidade de cada escola é derivada da CIDADE e do índice dela (`rngDe`), não da vida: quem volta à mesma escola
 * encontra o mesmo catálogo, e duas vidas na mesma cidade veem as mesmas escolas. Nada disso vai para o save (o save
 * guarda só a chave da escola escolhida, `EscolaBasica.integradoInst`).
 */
import { rngDe } from '../rng';
import { CURSOS, type Curso } from '../dados/cursos';
import { municipio, paisDaCidade, economiaLocal } from '../dados/lugares';

export type PerfilTecnico = 'industrial' | 'tecnologia' | 'gestao' | 'saude' | 'agro' | 'hotelaria' | 'criativa' | 'construcao' | 'politecnica';

/** O que cada perfil de escola costuma oferecer (o catálogo de UMA escola é um recorte disto). */
const POOL: Record<PerfilTecnico, string[]> = {
  industrial: ['tec_mecanica', 'tec_eletrotecnica', 'tec_automacao', 'tec_mecatronica', 'tec_eletronica', 'tec_seguranca', 'tec_logistica'],
  tecnologia: ['tec_informatica', 'tec_desenvolvimento', 'tec_redes', 'tec_eletronica', 'tec_design', 'tec_audiovisual'],
  gestao: ['tec_administracao', 'tec_contabilidade', 'tec_logistica', 'tec_imoveis', 'tec_hospedagem', 'tec_informatica'],
  saude: ['tec_enfermagem', 'tec_radiologia', 'tec_seguranca', 'tec_alimentos'],
  agro: ['tec_agropecuaria', 'tec_alimentos', 'tec_mecanica', 'tec_informatica', 'tec_administracao', 'tec_edificacoes'],
  hotelaria: ['tec_hospedagem', 'tecn_gastronomia', 'tec_administracao', 'tec_alimentos', 'tec_audiovisual'],
  criativa: ['tec_design', 'tec_audiovisual', 'tec_desenvolvimento', 'tec_informatica'],
  construcao: ['tec_edificacoes', 'tec_seguranca', 'tec_eletrotecnica', 'tec_design', 'tec_logistica'],
  // A escola de muitas áreas (o instituto federal, o kōsen, o politécnico): um pouco de cada eixo.
  politecnica: ['tec_informatica', 'tec_desenvolvimento', 'tec_eletrotecnica', 'tec_mecanica', 'tec_edificacoes', 'tec_mecatronica', 'tec_administracao', 'tec_alimentos', 'tec_eletronica']
};

const NOME_PERFIL: Record<PerfilTecnico, string> = {
  industrial: 'indústria', tecnologia: 'tecnologia', gestao: 'gestão e negócios', saude: 'saúde', agro: 'agropecuária e alimentos',
  hotelaria: 'turismo e hotelaria', criativa: 'design e audiovisual', construcao: 'construção', politecnica: 'várias áreas'
};

/**
 * A rota de formação profissional do país, no nível de abstração do VIDA: o nome da escola (pública e particular), se
 * ela junta o ensino médio (integrado) e como chama o ingresso. Países sem entrada própria usam a rota genérica.
 */
interface Rota {
  /** "o kōsen", "a formação dual" — como o texto chama a via. */
  via: string;
  /** Nome de uma escola pública de perfil `p` na cidade `c` (k: o índice, para não repetir). */
  publica: (c: string, p: PerfilTecnico, k: number) => string;
  particular: (c: string, p: PerfilTecnico) => string;
}
const ROTAS: Record<string, Rota> = {
  BR: { via: 'o médio integrado ao técnico', publica: (c, p, k) => (p === 'politecnica' ? `Instituto Federal, campus ${c}` : k % 2 ? `Escola Técnica Estadual de ${c}` : `Centro de Educação Profissional de ${c}`), particular: (c, p) => (p === 'industrial' || p === 'construcao' ? `Escola técnica da indústria (${c})` : p === 'hotelaria' || p === 'gestao' || p === 'saude' ? `Escola técnica do comércio (${c})` : `Colégio técnico particular de ${c}`) },
  PT: { via: 'o ensino profissional', publica: (c, _p, k) => (k % 2 ? `Escola Profissional de ${c}` : `Escola Secundária de ${c} (cursos profissionais)`), particular: c => `Escola Profissional privada de ${c}` },
  JP: { via: 'o kōsen (colégio técnico de cinco anos)', publica: (c, p, k) => (p === 'politecnica' || p === 'industrial' || k === 0 ? `Kōsen de ${c} (colégio técnico nacional)` : `Escola secundária técnica de ${c}`), particular: (c, p) => `Senmon gakkō de ${NOME_PERFIL[p]} (${c})` },
  DE: { via: 'a formação dual (escola e empresa)', publica: (c, _p, k) => `Berufsschule ${k + 1} de ${c} (formação dual)`, particular: c => `Escola profissional privada de ${c}` },
  AT: { via: 'a formação dual (escola e empresa)', publica: (c, _p, k) => `Berufsschule ${k + 1} de ${c} (formação dual)`, particular: c => `Escola profissional privada de ${c}` },
  CH: { via: 'a formação dual (escola e empresa)', publica: (c, _p, k) => `Escola profissional ${k + 1} de ${c} (formação dual)`, particular: c => `Escola profissional privada de ${c}` },
  FR: { via: 'o lycée professionnel', publica: (c, _p, k) => `Lycée professionnel ${k ? `nº ${k + 1} ` : ''}de ${c}`, particular: c => `Lycée professionnel privé de ${c}` },
  IT: { via: 'o instituto técnico', publica: (c, _p, k) => (k % 2 ? `Istituto Professionale de ${c}` : `Istituto Tecnico de ${c}`), particular: c => `Instituto técnico particular de ${c}` },
  ES: { via: 'a formação profissional (FP)', publica: (c, _p, k) => `Instituto de Formação Profissional ${k ? `nº ${k + 1} ` : ''}de ${c}`, particular: c => `Centro de FP particular de ${c}` },
  GB: { via: 'o college de formação técnica', publica: (c, _p, k) => (k ? `${c} Technical College` : `${c} College`), particular: c => `Escola técnica particular de ${c}` },
  IE: { via: 'o college de formação técnica', publica: c => `${c} College of Further Education`, particular: c => `Escola técnica particular de ${c}` },
  US: { via: 'o ensino técnico (career and technical education)', publica: (c, _p, k) => (k ? `${c} Community College (programas técnicos)` : `${c} Career and Technical High School`), particular: c => `Escola técnica particular de ${c}` },
  CA: { via: 'o college técnico', publica: (c, _p, k) => (k ? `${c} Polytechnic` : `${c} College`), particular: c => `Escola técnica particular de ${c}` },
  AU: { via: 'o TAFE (ensino técnico)', publica: (c, _p, k) => `TAFE ${c}${k ? ` — campus ${k + 1}` : ''}`, particular: c => `Escola técnica particular de ${c}` },
  NZ: { via: 'o politécnico', publica: (c, _p, k) => `${c} Polytechnic${k ? ` (campus ${k + 1})` : ''}`, particular: c => `Escola técnica particular de ${c}` },
  MX: { via: 'o bachillerato técnico', publica: (c, _p, k) => (k % 2 ? `CETIS de ${c}` : `CONALEP ${c}`), particular: c => `Bachillerato técnico particular de ${c}` },
  AR: { via: 'a escola técnica', publica: (c, _p, k) => `Escuela de Educación Técnica Nº ${k + 1} de ${c}`, particular: c => `Instituto técnico particular de ${c}` },
  CO: { via: 'a formação técnica', publica: (c, _p, k) => (k ? `Colegio técnico de ${c}` : `Centro de formação técnica pública de ${c}`), particular: c => `Instituto técnico particular de ${c}` },
  CL: { via: 'o ensino médio técnico-profissional', publica: (c, _p, k) => `Liceo Técnico Profesional ${k ? `nº ${k + 1} ` : ''}de ${c}`, particular: c => `Instituto Profesional de ${c}` },
  CN: { via: 'a escola secundária vocacional', publica: (c, _p, k) => `Escola vocacional nº ${k + 1} de ${c}`, particular: c => `Escola técnica particular de ${c}` },
  KR: { via: 'o colégio técnico especializado', publica: (c, _p, k) => `Colégio técnico de ${c}${k ? ` nº ${k + 1}` : ''}`, particular: c => `Colégio técnico particular de ${c}` },
  IN: { via: 'o ITI (instituto de formação industrial)', publica: (c, _p, k) => (k ? `Politécnico Governamental de ${c}` : `ITI de ${c}`), particular: c => `ITI particular de ${c}` },
  NG: { via: 'o colégio técnico', publica: (c, _p, k) => (k ? `Federal Polytechnic, ${c}` : `Government Technical College, ${c}`), particular: c => `Escola técnica particular de ${c}` },
  ZA: { via: 'o college TVET', publica: (c, _p, k) => `TVET College de ${c}${k ? ` (campus ${k + 1})` : ''}`, particular: c => `Escola técnica particular de ${c}` }
};
const ROTA_GENERICA: Rota = {
  via: 'a escola técnica',
  publica: (c, _p, k) => `Escola técnica pública de ${c}${k ? ` nº ${k + 1}` : ''}`,
  particular: c => `Escola técnica particular de ${c}`
};
export const rotaTecnica = (pais: string): Rota => ROTAS[pais] ?? ROTA_GENERICA;

export interface InstituicaoTecnica {
  /** Estável: a cidade e o índice da escola nela. */
  chave: string;
  nome: string;
  municipioId: string;
  perfil: PerfilTecnico;
  publica: boolean;
  /** Junta o ensino médio (a entrada aos 14–15)? */
  integra: boolean;
  /** Os cursos desta escola (ids de `CURSOS`) — sempre os mesmos. */
  cursos: string[];
  /** "uma escola de tecnologia" — para o texto. */
  sobre: string;
}

const QUANTAS = { metropole: 4, metropolitana: 3, capital: 3, polo: 2, pequena: 1 } as const;

/** O perfil mais provável de cada escola, pela cidade: a pequena puxa o agro; a do litoral, a hotelaria; a grande, tudo. */
function pesosDoPerfil(municipioId: string): Record<PerfilTecnico, number> {
  const m = municipio(municipioId);
  const barata = economiaLocal(municipioId).custo < 0.95;
  const w: Record<PerfilTecnico, number> = { industrial: 3, tecnologia: 3, gestao: 2.5, saude: 2, agro: 1, hotelaria: 1, criativa: 1, construcao: 1.5, politecnica: 2 };
  if (m.perfil === 'pequena' || barata) { w.agro += 5; w.tecnologia -= 1.5; w.criativa = 0.2; }
  if (m.perfil === 'polo') { w.industrial += 3; w.construcao += 1; }
  if (m.perfil === 'metropole') { w.tecnologia += 2; w.criativa += 2; w.saude += 1; w.gestao += 1; }
  if (m.litoral) w.hotelaria += 3;
  return w;
}

const cache = new Map<string, InstituicaoTecnica[]>();

/** As escolas técnicas de uma cidade (públicas e particulares), estáveis. */
export function instituicoesTecnicas(municipioId: string): InstituicaoTecnica[] {
  const ja = cache.get(municipioId);
  if (ja) return ja;
  const m = municipio(municipioId);
  const pais = paisDaCidade(municipioId);
  const rota = rotaTecnica(pais);
  const pesos = pesosDoPerfil(municipioId);
  const n = QUANTAS[m.perfil];
  const out: InstituicaoTecnica[] = [];
  const usados = new Set<PerfilTecnico>();
  for (let k = 0; k < n; k++) {
    const r = rngDe('escola-tecnica', municipioId, k);
    // A primeira é pública e de muitas áreas onde a rota tem uma (o instituto federal, o kōsen); as outras variam.
    const perfis = (Object.keys(pesos) as PerfilTecnico[]).filter(p => !usados.has(p));
    const perfil: PerfilTecnico = k === 0 && r.chance(0.55) ? 'politecnica' : (r.weighted(perfis, p => Math.max(0.05, pesos[p])) ?? 'gestao');
    usados.add(perfil);
    const publica = k === 0 || r.chance(0.55);
    const pool = POOL[perfil].filter(id => CURSOS.some(c => c.id === id));
    const quantos = Math.min(pool.length, perfil === 'politecnica' ? r.int(4, 6) : r.int(3, 5));
    const embaralhado = [...pool].sort((a, b) => rngDe(municipioId, k, a).next() - rngDe(municipioId, k, b).next());
    const cursos = embaralhado.slice(0, quantos);
    const nome = publica ? rota.publica(m.nome, perfil, k) : rota.particular(m.nome, perfil);
    out.push({ chave: `tec:${municipioId}:${k}`, nome, municipioId, perfil, publica, integra: publica && cursos.some(id => CURSOS.find(c => c.id === id)?.integravel), cursos, sobre: perfil === 'politecnica' ? 'uma escola de várias áreas' : `uma escola de ${NOME_PERFIL[perfil]}` });
  }
  cache.set(municipioId, out);
  return out;
}

export const instituicaoTecnica = (chave: string): InstituicaoTecnica | undefined => {
  const [, cidade, k] = chave.split(':');
  if (!cidade) return undefined;
  try { return instituicoesTecnicas(cidade)[Number(k)]; } catch { return undefined; }
};

/** As portas do médio integrado na cidade: as escolas públicas que juntam o médio, com os cursos integráveis delas. */
export function ofertaIntegrada(municipioId: string): { inst: InstituicaoTecnica; curso: Curso }[] {
  const out: { inst: InstituicaoTecnica; curso: Curso }[] = [];
  for (const inst of instituicoesTecnicas(municipioId).filter(i => i.integra)) {
    for (const id of inst.cursos) { const c = CURSOS.find(x => x.id === id); if (c?.integravel) out.push({ inst, curso: c }); }
  }
  return out;
}

/** Quem oferece este curso técnico nesta cidade (a primeira escola pública que tem; senão, a particular). */
export function quemOferece(municipioId: string, cursoId: string, publica?: boolean): InstituicaoTecnica | undefined {
  const lista = instituicoesTecnicas(municipioId).filter(i => i.cursos.includes(cursoId) && (publica === undefined || i.publica === publica));
  return lista[0];
}
