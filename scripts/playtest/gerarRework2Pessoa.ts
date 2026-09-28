/**
 * Cenários visuais do REWORK 2 (pessoa, corpo, mente e relações), para
 * `rework2.mjs` (as mesmas verificações estruturais do rework anterior):
 *
 *   - vestibulanda-medicina: objetivo Medicina, cursinho, um ENEM feito (devolutiva);
 *   - sinais: adulto com diabetes sem diagnóstico, academia, uma amiga pedindo ajuda;
 *   - solteira: adulta sem parceria, com interesse no ar (busca ativa) e um convite;
 *   - casal: a parceria pediu para conversar; um amigo cobra a distância.
 *
 *   npx esbuild scripts/playtest/gerarRework2Pessoa.ts --bundle --platform=node --outfile=/tmp/grp.cjs && SP=/tmp/vida-rw2p node /tmp/grp.cjs
 *   SP=/tmp/vida-rw2p CEN=vestibulanda-medicina,sinais,solteira,casal node scripts/playtest/rework2.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar, type Acao } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade } from '../../src/motor/nucleo';
import { criarPessoa, vincular } from '../../src/motor/pessoas';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';

const SP = process.env.SP ?? '/tmp/vida-rw2p';
mkdirSync(SP, { recursive: true });
function viver(v: Vida, ate: number, acoes: (v: Vida) => Acao[] = () => []): Vida {
  while (!v.morte && idade(v) < ate) {
    for (const a of acoes(v)) v = executar(v, a).vida;
    v = avancarAno(v).vida;
    for (let k = 0; k < 12 && v.momento; k++) v = executar(v, { tipo: 'decidir', opcaoId: (v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]).id }).vida;
  }
  return v;
}
const nasce = (s: number, genero: 'feminino' | 'masculino') => criarVida({ nome: genero === 'feminino' ? 'Joana' : 'Davi', sobrenome: 'Reis', genero, municipioId: 'recife-pe', semente: s });
const gravar = (nome: string, v: Vida) => { v.momento = null; v.caminhos.pendente = undefined; writeFileSync(`${SP}/save-${nome}.json`, JSON.stringify(v)); console.log(nome.padEnd(22), idade(v)); };
const limpar = (v: Vida) => { for (const vin of Object.values(v.vinculos)) { vin.chamado = undefined; if (vin.romance && vin.romance.estagio !== 'ex') vin.romance = undefined; } };
const gente = (v: Vida, s: number, nome: string, genero: 'feminino' | 'masculino', estagio: 'amigo_proximo' | 'amigo' = 'amigo_proximo') => {
  const p = criarPessoa(v, criarRng(s), { idade: idade(v), genero, municipioId: v.moradia.municipioId }); p.nome = nome;
  const vin = vincular(v, p, { origem: 'escola', proximidade: 72, estagio, convivio: [] }); vin.tInicio = v.t - 120; vin.confianca = 65;
  return { p, vin };
};

{
  let v = viver(nasce(2601, 'feminino'), 16, x => [{ tipo: 'postura', valor: 'dedicada' }, ...(idade(x) >= 8 ? [{ tipo: 'rotina', id: 'leitura', ativa: true, nivel: 1 } as Acao] : [])]);
  v.educacao.basica = { etapa: 'medio', serie: 2, rede: 'publica', desempenho: 68, reprovacoes: 0 };
  v = executar(v, { tipo: 'objetivo_estudo', cursoId: 'medicina' }).vida;
  v = executar(v, { tipo: 'rotina', id: 'cursinho', ativa: true, nivel: 1 }).vida;
  v = viver(v, 17);
  v.anoAtual = { acoes: [] };
  v = executar(v, { tipo: 'enem' }).vida;
  gravar('vestibulanda-medicina', v);
}
{
  let v = viver(nasce(2602, 'masculino'), 41, x => (idade(x) >= 38 ? [{ tipo: 'rotina', id: 'academia', ativa: true, nivel: 1 }] : []));
  limpar(v);
  v.corpo.condicoes = [{ id: 'diabetes', nome: 'diabetes', tInicio: v.t - 18, cronica: true, gravidade: 2, tratando: false, diagnosticada: false }];
  if (!v.trabalho.atual) contratar(v, criarRng(2), ocupacao('assistente_adm'));
  const { p, vin } = gente(v, 3, 'Marta', 'feminino');
  p.aperto = { tipo: 'desemprego', t: v.t }; p.renda = 0;
  vin.chamado = { tipo: 'pedido_ajuda', t: v.t, texto: 'Marta perdeu o emprego e pediu ajuda: uma indicação, um currículo revisado, qualquer coisa.', assunto: 'emprego' };
  gravar('sinais', v);
}
{
  let v = viver(nasce(2603, 'feminino'), 28);
  limpar(v);
  v.eu.atracao = 'homens';
  const q = criarPessoa(v, criarRng(4), { idade: 29, genero: 'masculino', municipioId: v.moradia.municipioId }); q.nome = 'Rafael'; q.atracao = 'mulheres'; q.parceiroId = undefined;
  const vq = vincular(v, q, { origem: 'online', proximidade: 28, estagio: 'conhecido' });
  vq.romance = { estagio: 'interesse', tEstagio: v.t, envolvimento: 60 };
  const { vin } = gente(v, 5, 'Carol', 'feminino', 'amigo');
  vin.chamado = { tipo: 'convite', t: v.t, texto: 'Carol chamou você para um show.', assunto: 'um show' };
  gravar('solteira', v);
}
{
  let v = viver(nasce(2604, 'masculino'), 36);
  limpar(v);
  const p = criarPessoa(v, criarRng(6), { idade: 35, genero: 'feminino', municipioId: v.moradia.municipioId }); p.nome = 'Luana';
  const vp = vincular(v, p, { origem: 'romance', proximidade: 60, convivio: ['casa'] });
  vp.romance = { estagio: 'casamento', tEstagio: v.t - 60, tInicio: v.t - 96, envolvimento: 40 }; vp.tensao = 50;
  vp.chamado = { tipo: 'conversa_casal', t: v.t, texto: 'Luana disse que precisa conversar sobre vocês.' };
  const { vin } = gente(v, 7, 'Igor', 'masculino');
  vin.tUltimoContato = v.t - 36; vin.chamado = { tipo: 'reclamacao', t: v.t, texto: 'Igor mandou mensagem: "sumiu, hein?"' };
  gravar('casal', v);
}
