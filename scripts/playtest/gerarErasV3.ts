// ERAS v3 — saves para o QA da interface: vidas de vários países e épocas, jogadas por agentes até um ano-alvo
// (inclui a Alemanha Oriental, o Japão de Shōwa e o Brasil do mil-réis). OUT=<pasta> (padrão ~/vida-trabalho/e3/saves).
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { entrarNaVida } from '../../src/motor/mundo/vida';
import { anoDe } from '../../src/motor/tempo';
import { agente } from '../sim/agentes';
import { mkdirSync, writeFileSync } from 'node:fs';
await carregarMundo();
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/e3/saves`;
mkdirSync(OUT, { recursive: true });
const ALVOS: [string, number, number, string, string][] = [
  ['V3-BR-1905-1928', 1905, 1928, 'sao-paulo-sp', 'estudioso'], ['V3-US-1912-1934', 1912, 1934, 'us:chicago', 'ambicioso'],
  ['V3-GB-1925-1941', 1925, 1941, 'gb:londres', 'social'], ['V3-DE-1950-1975', 1950, 1975, 'de:leipzig', 'familiar'],
  ['V3-DE-1935-1949', 1935, 1949, 'de:hamburgo', 'economico'], ['V3-JP-1930-1955', 1930, 1955, 'jp:osaka', 'estudioso'],
  ['V3-AR-1960-1990', 1960, 1990, 'ar:cordoba', 'aleatorio'], ['V3-US-1945-1962', 1945, 1962, 'us:atlanta', 'social']
];
for (const [nome, ano, ate, municipioId, perfil] of ALVOS) {
  const ag = agente(perfil), r = criarRng(ano);
  let v = criarVida({ nome: 'Lia', sobrenome: 'Tempo', genero: ano % 2 ? 'feminino' : 'masculino', municipioId, semente: 9100 + ano, ano, era: true, mes: 3, dia: 12 } as never);
  const responder = () => { for (let j = 0; j < 12 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, v.momento!, r) }).vida; };
  while (!v.morte && anoDe(v.t) < ate) {
    for (const a of ag.agir(v, r)) { if (!podeTentar(disponibilidade(v, a))) continue; v = executar(v, a).vida; responder(); }
    v = avancarAno(v).vida; responder(); entrarNaVida(v);
  }
  writeFileSync(`${OUT}/${nome}.json`, JSON.stringify(v));
  console.log(nome, anoDe(v.t), v.morte ? 'MORTA' : 'viva');
}
