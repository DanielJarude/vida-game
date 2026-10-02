/**
 * Cenários visuais do pacote pré-América do Sul (sucessão, economia, trabalho/riqueza, condicionamento, viagens, técnico):
 *   legado      morte com dois filhos e a partilha (tela do legado)
 *   herdeira    a filha que continuou (Você · "Quem veio antes"; Pessoas da perspectiva dela)
 *   rico        R$ 89 mi, sem trabalhar (Trabalho · Vida/Dinheiro com o extrato do ano)
 *   base        13 anos, base de futebol, lesão no ombro (Você · condicionamento)
 *   viajante    adulta com dinheiro (Tempo livre · viagens)
 *   tecnico     ex-jogador técnico há 12 anos (Trabalho · "Carreira como técnico"; esporte com iconografia)
 *   npx esbuild scripts/playtest/gerarPreAmerica.ts --bundle --platform=node --outfile=/tmp/gpa.cjs && SP=/tmp/vida-pa node /tmp/gpa.cjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import { transacao } from '../../src/motor/nucleo';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { entrarNaBase, encerrarCarreira, fecharTemporada, profissionalizar } from '../../src/motor/sistemas/esporte';
import { registrarTemporada } from '../../src/motor/sistemas/palmares';
import { calcularHeranca } from '../../src/motor/sistemas/partilha';
import { continuarComo } from '../../src/motor/sistemas/sucessao';
import { adulto, comFilho, comNeto, comParceiro, pessoaNova } from '../../src/motor/__tests__/cenarios';
import type { Vida } from '../../src/motor/tipos';

const SP = process.env.SP ?? '/tmp/vida-pa';
mkdirSync(SP, { recursive: true });
const salvar = (nome: string, v: Vida) => writeFileSync(`${SP}/${nome}.json`, JSON.stringify(v));
const responder = (v: Vida) => { for (let j = 0; j < 12 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)?.id ?? v.momento.opcoes[0].id }).vida; return v; };

// legado + herdeira
{
  const v = adulto(78, { semente: 11, genero: 'masculino' });
  v.eu.nome = 'Bento';
  for (const vin of Object.values(v.vinculos)) if (vin.parentesco === 'mae' || vin.parentesco === 'pai') v.pessoas[vin.pessoaId].vivo = false;
  const { p: mae } = comParceiro(v, { idade: 75, estagio: 'casamento', anos: 50, genero: 'feminino' });
  const { p: a } = comFilho(v, 48, { outroId: mae.id, casa: false, genero: 'masculino' });
  const { p: b } = comFilho(v, 44, { outroId: mae.id, casa: false, genero: 'feminino' });
  const { p: c } = comFilho(v, 16, { outroId: mae.id, casa: true, genero: 'masculino' });
  void c;
  a.ocupacaoId = 'professor_infantil'; a.ocupacao = 'professor de educação infantil'; a.renda = 4200;
  b.ocupacaoId = 'enfermeiro'; b.ocupacao = 'enfermeira'; b.renda = 6800; b.formacao = 'Enfermagem'; b.vida!.escolaridade = 'superior'; b.vida!.experiencia = 220;
  b.vida!.trajetoria.push({ t: v.t - 300, texto: `${b.nome} se formou em Enfermagem.`, tipo: 'estudo' }, { t: v.t - 200, texto: `${b.nome} foi chefiar a enfermagem do hospital.`, tipo: 'promocao' });
  const par = pessoaNova(v, 46, 'masculino'); par.parceiroId = b.id; b.parceiroId = par.id; par.renda = 5200;
  v.fatos[`namoro_${b.id}`] = v.t - 260; v.fatos[`casou_${b.id}`] = v.t - 220; v.fatos[`uniao_cartorio_${b.id}`] = 1;
  v.vinculos[par.id] = { pessoaId: par.id, parentesco: 'genro', origem: 'familia', tInicio: v.t - 220, proximidade: 45, confianca: 50, tensao: 0, convivio: [], tUltimoContato: v.t, historia: [] };
  comNeto(v, b, 15, par.id); comNeto(v, a, 9);
  v.financas.conta = 85000;
  v.financas.investimentos = [{ id: 'apl_pos_fixado', produto: 'pos_fixado', aportado: 600000, valor: 720000, tInicio: v.t - 200, historico: [], pico: 720000 }];
  v.financas.bens = [{ id: 'icasa', tipo: 'imovel', modeloId: 'casa_3q', nome: 'casa de três quartos', valor: 640000, tCompra: v.t - 400, municipioId: v.moradia.municipioId, estado: 70, dono: 'casal' }, { id: 'vcarro', tipo: 'veiculo', modeloId: 'compacto', nome: 'carro compacto', valor: 48000, tCompra: v.t - 30, estado: 70 }];
  v.moradia = { tipo: 'propria', municipioId: v.moradia.municipioId, imovelId: 'icasa', modeloId: 'casa_3q', aluguel: 0, padrao: 4, tInicio: v.t - 400 };
  v.vinculos[mae.id].convivio = ['casa'];
  v.fatos[`uniao_${mae.id}`] = v.t - 600; v.fatos[`patrimonio_uniao_${mae.id}`] = 0;
  v.morte = { t: v.t, causa: 'insuficiência cardíaca', heranca: calcularHeranca(v) };
  salvar('legado', v);
  salvar('herdeira', continuarComo(v, b.id).vida);
}

// rico sem trabalhar
{
  const v = adulto(58, { semente: 31, genero: 'masculino' });
  v.trabalho.atual = undefined;
  v.trabalho.desempregadoDesde = v.t - 60;
  v.financas.conta = 1_200_000;
  v.financas.investimentos = [{ id: 'apl_pos_fixado', produto: 'pos_fixado', aportado: 70_000_000, valor: 83_000_000, tInicio: v.t - 200, historico: [], pico: 83_000_000 }];
  salvar('rico', responder(avancarAno(v).vida));
}

// base de futebol com lesão no ombro
{
  let v = criarVida({ nome: 'Caio', sobrenome: 'Rocha', genero: 'masculino', municipioId: 'uberaba-mg', semente: 77 });
  for (let k = 0; k < 12; k++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  v = transacao(v, x => { garantirFrente(x, 'futebol'); Object.assign(x.caminhos.frentes.futebol!, { habilidade: 70, interesse: 95, meses: 60 }); entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Uberaba'); }).vida;
  v = responder(avancarAno(v).vida);
  v.corpo.condicoes.push({ id: 'les1', nome: 'lesão no ombro', tInicio: v.t - 2, cronica: false, gravidade: 2, tratando: true, lesao: { parte: 'ombro', gravidade: 2, tFim: v.t + 4, origem: 'pratica', cuidado: 'fisio' } });
  salvar('base', v);
}

// viajante
{
  const v = adulto(34, { semente: 41 });
  v.financas.conta = 90000;
  salvar('viajante', v);
}

// técnico ex-jogador
{
  let v = criarVida({ nome: 'Otávio', sobrenome: 'Lima', genero: 'masculino', municipioId: 'sao-paulo-sp', semente: 990004 });
  for (let k = 0; k < 24 && !v.morte; k++) v = responder(avancarAno(v).vida);
  v = transacao(v, (x, rr) => {
    x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.educacao.basica = undefined; x.caminhos.oportunidades = [];
    garantirFrente(x, 'futebol'); garantirFrente(x, 'lideranca');
    Object.assign(x.caminhos.frentes.futebol!, { habilidade: 88, interesse: 90, meses: 200, auge: 90 });
    entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Sport');
    profissionalizar(x, rr, 3);
    const e = x.caminhos.esporte!;
    for (let k = 0; k < 10; k++) { const t = fecharTemporada(x, rr, e); registrarTemporada(x, rr, e, t); x.t += 12; }
    encerrarCarreira(x, e, 'idade');
    x.trabalho.experiencia['treino'] = 48;
    contratar(x, rr, ocupacao('tecnico_futebol'), 'oportunidade');
    x.momento = null;
  }).vida;
  const r = criarRng(5);
  void r;
  for (let k = 0; k < 12 && !v.morte; k++) v = responder(avancarAno(v).vida);
  salvar('tecnico', v);
}
console.log('ok');
