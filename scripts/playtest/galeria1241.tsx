import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { Figura } from '../../src/ui/avatar/Figura';
import { Retrato } from '../../src/ui/avatar/Retrato';
const visM: any = { pele: 'p3', cabelo: 'curto', corCabelo: 'castanho_escuro', olhos: 'castanho', barba: 'curta' };
const visF: any = { pele: 'p2', cabelo: 'longo_ondulado', corCabelo: 'castanho', olhos: 'verde' };
const visN: any = { pele: 'p5', cabelo: 'crespo_curto', corCabelo: 'preto', olhos: 'castanho_escuro' };
const P = (ids: string[]) => ids.map((itemId, k) => ({ itemId, id: `e${k}${itemId}` }));
const L: { t: string; html: string }[] = [];
const add = (t: string, el: any) => L.push({ t, html: renderToStaticMarkup(el) });
const corpos = ['magro', 'mediano', 'atletico', 'musculoso', 'acima_do_peso'] as const;
for (const c of corpos) add(`M ${c}`, <Figura visual={visM} genero="masculino" idade={32} corpo={c} pecas={P(['camiseta_lisa', 'jeans', 'tenis_casual', 'relogio'])} largura={180} />);
for (const c of corpos) add(`F ${c}`, <Figura visual={visF} genero="feminino" idade={30} corpo={c} pecas={P(['blusa_seda', 'saia_midi', 'scarpin', 'pulseira_ouro', 'corrente_prata', 'brincos'])} largura={180} />);
for (const i of [4, 7, 10, 14, 17, 45, 75]) add(`idade ${i}`, <Figura visual={visN} genero={i % 2 ? 'feminino' : 'masculino'} idade={i} corpo="mediano" pecas={[]} largura={180} />);
const looks: [string, string[], any, any][] = [
  ['social', ['camisa_social', 'calca_alfaiataria', 'sapato_social', 'relogio_luxo'], visM, 'masculino'],
  ['terno', ['terno', 'sapato_social'], visM, 'masculino'],
  ['streetwear', ['moletom_oversized', 'calca_cargo', 'tenis_cano_alto', 'corrente_grossa'], visN, 'masculino'],
  ['rock', ['camiseta_banda', 'jeans', 'jaqueta_couro', 'coturno', 'anel_prata'], visF, 'feminino'],
  ['baile', ['camisa_time', 'bermuda_tactel', 'chinelo_slide', 'oculos_juliet'], visN, 'masculino'],
  ['vestido floral', ['vestido_floral', 'sandalia'], visF, 'feminino'],
  ['vestido festa', ['vestido_festa', 'scarpin', 'joia'], visF, 'feminino'],
  ['chita', ['vestido_chita', 'sapatilha'], visN, 'feminino'],
  ['regional', ['camisa_xadrez', 'bombacha', 'botina'], visM, 'masculino'],
  ['afro', ['bata_wax', 'calca_alfaiataria', 'sandalia', 'guias', 'pulseira_contas'], visN, 'feminino'],
  ['esporte', ['regata', 'legging', 'tenis_corrida', 'smartwatch'], visF, 'feminino'],
  ['polo', ['camisa_polo', 'bermuda_sarja', 'mocassim'], visM, 'masculino'],
  ['inverno', ['sueter_tricot', 'jeans', 'casaco_la', 'coturno'], visF, 'feminino'],
  ['sobretudo', ['camisa_social', 'calca_alfaiataria', 'sobretudo_grife', 'sapato_social'], visM, 'masculino'],
  ['corta-vento', ['camiseta_listrada', 'jeans', 'corta_vento', 'tenis_lona'], visN, 'masculino'],
  ['macacão', ['macacao', 'tenis_lona'], visF, 'feminino'],
  ['short', ['cropped', 'short_jeans', 'tenis_casual'], visF, 'feminino'],
  ['jeans jacket', ['camiseta_lisa', 'saia_lapis', 'jaqueta_jeans', 'sapatilha'], visF, 'feminino'],
  ['blazer', ['camiseta_lisa', 'jeans', 'blazer', 'mocassim', 'relogio_digital'], visM, 'masculino'],
  ['esportiva antiga', ['roupa_esportiva'], visM, 'masculino'],
];
for (const [t, ids, vis, g] of looks) add(t, <Figura visual={vis} genero={g} idade={28} corpo="mediano" pecas={P(ids)} largura={180} />);
for (const [t, ids, vis, g] of looks.slice(0, 10)) add(`mini ${t}`, <Figura visual={vis} genero={g} idade={28} corpo="mediano" pecas={P(ids)} largura={72} />);
// bustos com superior
for (const sup of ['camisa_social', 'moletom_oversized', 'camisa_time', 'camiseta_listrada', 'camisa_polo', 'blazer', 'jaqueta_couro', 'regata', 'camisa_xadrez', 'vestido_floral'])
  add(`busto ${sup}`, <Retrato visual={{ ...visM, superior: `${sup}#e1${sup}` }} genero="masculino" idade={30} semente="x" tamanho={110} />);
const html = `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#efe9dd;display:flex;flex-wrap:wrap;gap:6px;margin:8px}.c{display:flex;flex-direction:column;align-items:center;background:#fff;padding:4px;border-radius:6px}</style>${L.map(x => `<div class=c>${x.html}<span>${x.t}</span></div>`).join('')}`;
writeFileSync(process.env.OUT!, html);
// cômodos (12.4.1) — página separada
import { CenaDoComodo } from '../../src/ui/ilustracao/comodos';
const C: { t: string; html: string }[] = [];
const cena = (t: string, el: any) => C.push({ t, html: renderToStaticMarkup(el) });
cena('sala simples', <CenaDoComodo tipo="sala" objetos={[{ coisaId: 'sofa', id: 'a' }, { coisaId: 'tv', id: 'b' }, { coisaId: 'violao', id: 'c' }]} rotulo="sala" />);
cena('sala taco+tijolo+quente', <CenaDoComodo tipo="sala" parede={{ id: 'tijolo', cor: '#a5583c' }} piso={{ id: 'madeira', cor: '#8f5e37' }} luz="quente" objetos={[{ coisaId: 'sofa', id: 'a' }, { coisaId: 'poltrona', id: 'b' }, { coisaId: 'piano', id: 'c' }]} rotulo="sala" />);
cena('quarto papel', <CenaDoComodo tipo="quarto" parede={{ id: 'papel', cor: '#b7a37d' }} piso={{ id: 'vinilico', cor: '#b48a5e' }} objetos={[{ coisaId: 'colchao', id: 'a' }, { coisaId: 'escrivaninha', id: 'b' }, { coisaId: 'notebook', id: 'c' }]} rotulo="q" />);
cena('cozinha', <CenaDoComodo tipo="cozinha" objetos={[{ coisaId: 'maquina_lavar', id: 'a' }, { coisaId: 'mesa_jantar', id: 'b' }]} rotulo="c" />);
cena('banheiro marmore', <CenaDoComodo tipo="banheiro" piso={{ id: 'marmore', cor: '#e8e4dc' }} parede={{ id: 'verde_menta', cor: '#a9cdb6' }} objetos={[]} rotulo="b" />);
cena('escritório planejada', <CenaDoComodo tipo="escritorio" parede={{ id: 'azul_petroleo', cor: '#2f5d68' }} piso={{ id: 'porcelanato', cor: '#d6d0c6' }} luz="planejada" objetos={[{ coisaId: 'escrivaninha', id: 'a' }, { coisaId: 'computador', id: 'b' }]} rotulo="e" />);
cena('estúdio automação', <CenaDoComodo tipo="estudio" parede={{ id: 'grafite', cor: '#45484c' }} piso={{ id: 'cimento', cor: '#9b9894' }} luz="automacao" objetos={[{ coisaId: 'bateria', id: 'a' }, { coisaId: 'guitarra', id: 'b' }, { coisaId: 'teclado', id: 'c' }, { coisaId: 'home_studio', id: 'd' }]} rotulo="s" />);
cena('jardim', <CenaDoComodo tipo="jardim" objetos={[{ coisaId: 'camping', id: 'a' }]} rotulo="j" />);
cena('piscina', <CenaDoComodo tipo="piscina" objetos={[]} rotulo="p" />);
cena('lazer', <CenaDoComodo tipo="lazer" objetos={[{ coisaId: 'mesa_jantar', id: 'a' }]} rotulo="l" />);
cena('academia', <CenaDoComodo tipo="academia" objetos={[{ coisaId: 'esteira', id: 'a' }, { coisaId: 'estacao_musculacao', id: 'b' }, { coisaId: 'kit_academia', id: 'c' }]} rotulo="a" />);
cena('cinema', <CenaDoComodo tipo="cinema" luz="automacao" objetos={[{ coisaId: 'projetor', id: 'a' }, { coisaId: 'sofa', id: 'b' }]} rotulo="ci" />);
cena('mini sala', <CenaDoComodo tipo="sala" objetos={[{ coisaId: 'sofa', id: 'a' }, { coisaId: 'tv', id: 'b' }]} largura={132} rotulo="m" />);
writeFileSync(process.env.OUT!.replace('.html', '-comodos.html'), `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#efe9dd;display:flex;flex-wrap:wrap;gap:6px;margin:8px}.c{display:flex;flex-direction:column;align-items:center;background:#fff;padding:4px;border-radius:6px}</style>${C.map(x => `<div class=c>${x.html}<span>${x.t}</span></div>`).join('')}`);
