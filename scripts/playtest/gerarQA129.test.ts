/** VIDA 12.9 — saves do QA visual das frentes (estudos, empresas, presidência). Só roda com QA129=<pasta>. */
import { it } from 'vitest';
import { writeFileSync } from 'fs';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { transacao } from '../../src/motor/nucleo';
import { executar, disponibilidade, type Acao } from '../../src/motor/acoes';
import { avancarAno } from '../../src/motor/ano';
import { criarRng } from '../../src/motor/rng';
import { podeTentar } from '../../src/motor/plausibilidade';
import { definirPaisCorrente } from '../../src/motor/mundo/moeda';
import { partidosDoPais, entrarNaPolitica, processarPolitica, registrarCandidatura, tDaEleicao, tDaPosse } from '../../src/motor/sistemas/politica';
import { presidencia } from '../../src/motor/sistemas/presidencia129';
import { processarEmpresas } from '../../src/motor/sistemas/empresas';
import { AREAS_ENEM } from '../../src/motor/sistemas/escola';
import type { Vida } from '../../src/motor/tipos';
import { versaoVeiculo } from '../../src/motor/dados/bens';

const OUT = process.env.QA129;
const salvar = (n: string, v: Vida) => { v.momento = null; delete v.fila; writeFileSync(`${OUT}/saves/vida-r129-${n}.json`, JSON.stringify(v)); };
const tenta = (v: Vida, a: Acao) => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : (console.warn('não deu', JSON.stringify(a), disponibilidade(v, a).motivo), v));
const candidata = (cidade: string, preparo: number) => transacao(adulto(18, { semente: 23, municipioId: cidade }), x => {
  x.educacao.basica = undefined; x.educacao.matricula = undefined; x.educacao.aprovacao = undefined; x.educacao.escolaridade = 'medio';
  x.trabalho.atual = undefined; x.financas.conta = 200000; x.mente.cognicao = preparo;
  for (const a of AREAS_ENEM) x.caminhos.frentes[a] = { ...(x.caminhos.frentes[a] ?? {}), habilidade: preparo } as never;
  x.educacao.enem = [{ t: x.t, nota: 300 + preparo * 6, areas: Object.fromEntries(AREAS_ENEM.map(a => [a, 300 + preparo * 6])) as never, pais: 'BR' }];
}).vida;

it.skipIf(!OUT)('gera os saves', () => {
  salvar('vestibulanda', candidata('sao-paulo-sp', 72));
  let e = candidata('sao-paulo-sp', 85);
  e = tenta(e, { tipo: 'estudos129', oque: 'candidatar', chave: 'inst:pucsp:monte-alegre:direito:vestibular_privada', turno: 'noite' } as Acao);
  e = tenta(e, { tipo: 'confirmar_matricula' } as Acao);
  for (let k = 0; k < 2; k++) { e = avancarAno(e).vida; e.momento = null; }
  salvar('estudante', e);
  let r = transacao(adulto(48, { semente: 1291, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 9e9; x.financas.dividas = []; x.financas.negativado = false; x.financas.empresas = []; x.anoAtual = { acoes: [] }; }).vida;
  r = tenta(r, { tipo: 'fundar129', setor: 'montadora', item: 'eletrico', comSocio: false } as Acao);
  for (let k = 0; k < 4; k++) { r.t += 12; r.anoAtual = { acoes: [] }; r = transacao(r, (x, g) => processarEmpresas(x, g)).vida; }
  salvar('empresaria', r);
  definirPaisCorrente('BR');
  const p = transacao(adulto(30, { semente: 1290 }), () => {}).vida;
  p.moradia.municipioId = 'sao-paulo-sp'; p.eu.municipioNatal = 'sao-paulo-sp'; p.eu.nacionalidades = ['BR'];
  p.t = tDaEleicao(2030, 'BR') - 6; p.eu.tNasc = p.t - 54 * 12;
  p.caminhos.politica = undefined; p.trabalho.atual = undefined; p.justica = undefined; p.momento = null; p.fila = undefined; p.anoAtual = { acoes: [] };
  const pol = entrarNaPolitica(p, 'comunidade');
  pol.partido = partidosDoPais('BR')[0]; pol.tFiliacao = p.t - 160; pol.partidos = [{ sigla: pol.partido, tInicio: pol.tFiliacao }];
  pol.fase = 'entre_mandatos'; pol.apoio = 70; pol.reputacao = 85; pol.desgaste = 10;
  for (const c of ['deputado_federal', 'governador'] as const) { pol.historico.push({ t: p.t - 120, cargo: c, resultado: 'eleito', partido: pol.partido }); pol.historico.push({ t: p.t - 72, cargo: c, resultado: 'concluiu', partido: pol.partido }); }
  registrarCandidatura(p, 'presidente', tDaEleicao(2030, 'BR'));
  presidencia(p).campanha!.chapa = 'coligacao';
  for (const a of presidencia(p).campanha!.adversarios) a.forca = 10;
  p.t = tDaEleicao(2030, 'BR') + 1; processarPolitica(p, criarRng(4));
  p.t = tDaPosse(2030, 'BR') + 1; p.anoAtual = { acoes: [] }; processarPolitica(p, criarRng(5));
  salvar('presidente', p);
  // 12.9.1: o colecionador de motos clássicas (a garagem, a coleção, as peças no desenho).
  const m = transacao(adulto(50, { semente: 1291, municipioId: 'sao-paulo-sp' }), x => {
    x.financas.conta = 5_000_000; x.financas.dividas = []; x.financas.negativado = false;
    if (!x.trabalho.licencas.includes('cnh')) x.trabalho.licencas.push('cnh');
    x.financas.bens = [{ id: 'icasa', tipo: 'imovel', modeloId: 'casa_3q', nome: 'casa', valor: 900000, tCompra: x.t - 60, municipioId: x.moradia.municipioId, estado: 80 } as never];
    x.moradia = { tipo: 'propria', municipioId: x.moradia.municipioId, imovelId: 'icasa', modeloId: 'casa_3q', aluguel: 0, padrao: 4, tInicio: x.t - 60 };
    for (const [id, mods] of [['vincent_black_shadow_1950', { filete: 'dourado' }], ['honda_cb750_1970', {}], ['harley_knucklehead_1937', { banco: 'couro_caramelo' }], ['ducati_750ss_1974', {}], ['triumph_t120_1969', {}]] as const) {
      const ver = versaoVeiculo(id)!;
      x.financas.bens.push({ id: `v-${id}`, tipo: 'veiculo', modeloId: ver.classe, versaoId: id, nome: `${ver.marca} ${ver.modelo}`, valor: ver.preco, tCompra: x.t - 24, estado: 85, anoFabricacao: ver.ano ?? 2000, precoPago: ver.preco, papel: 'colecao', mods } as never);
    }
  }).vida;
  salvar('motos', m);
});
