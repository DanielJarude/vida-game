/**
 * VIDA 13 — IDENTIDADE VISUAL (complemento): os cortes, as barbas, as cores de tinta, as mechas e a maquiagem novas.
 * Tudo é escolha de visual (grátis, como cortar o cabelo): nada vai para os genes (`identidade.genesDe` tira) e nada
 * é de um gênero só. Cada opção tem desenho próprio no retrato (`ui/avatar/cabelos`, `ui/avatar/identidade13`). Puro.
 */

/** Cortes novos. `restrito`: antes da idade de decidir o visual (13), a família não deixa. */
export const CORTES_13: { id: string; nome: string; curto?: boolean; restrito?: boolean }[] = [
  { id: 'degrade', nome: 'Degradê (laterais batidas)', curto: true },
  { id: 'moicano', nome: 'Moicano', curto: true, restrito: true },
  { id: 'undercut', nome: 'Undercut (lados raspados, topo longo)', curto: true, restrito: true },
  { id: 'raspado_lado', nome: 'Raspado de um lado', restrito: true },
  { id: 'mullet', nome: 'Mullet' },
  { id: 'bob_franja', nome: 'Bob com franja reta' },
  { id: 'shag', nome: 'Repicado (shag, franja cortina)' },
  { id: 'longo_franja', nome: 'Longo com franja' },
  { id: 'meio_preso', nome: 'Meio preso' },
  { id: 'dois_coques', nome: 'Dois coques' },
  { id: 'maria_chiquinha', nome: 'Maria-chiquinha' }
];

/** Barbas novas (comprimentos e desenhos que faltavam). */
export const BARBAS_13: { id: string; nome: string }[] = [
  { id: 'desenhada', nome: 'Desenhada (contorno marcado)' }, { id: 'lenhador', nome: 'Lenhador (bem longa e cheia)' },
  { id: 'queixo', nome: 'Barba de queixo (contorno fino)' }, { id: 'van_dyke', nome: 'Van Dyke (cavanhaque e bigode separados)' },
  { id: 'mosca', nome: 'Mosca (só embaixo do lábio)' }, { id: 'bigode_fino', nome: 'Bigode fino' },
  { id: 'bigode_guidao', nome: 'Bigode guidão (pontas viradas)' }, { id: 'ferradura', nome: 'Bigode ferradura' }
];
/** As novas que vão com ou sem bigode (as outras já são o bigode, ou o têm separado). */
export const BARBAS_COM_BIGODE_13 = ['desenhada', 'lenhador', 'queixo', 'mosca'];

/** Cores de tinta novas (o cobre e o mel são tinta: o natural é o ruivo e o loiro). */
export const CORES_TINTA_13 = ['verde', 'roxo', 'cobre', 'mel', 'prata'];
export const NOME_COR_13: Record<string, string> = { verde: 'Verde (tinta)', roxo: 'Roxo (tinta)', cobre: 'Cobre (tinta)', mel: 'Mel (tinta)', prata: 'Prateado (tinta)' };

/** Mechas: o jeito (luzes finas, o degradê até as pontas, uma mecha só na frente) e a cor (qualquer natural ou de tinta). */
export const MECHAS_13: { id: string; nome: string }[] = [
  { id: 'luzes', nome: 'Luzes (mechas finas)' }, { id: 'ombre', nome: 'Ombré (clareia até as pontas)' }, { id: 'frente', nome: 'Uma mecha na frente' }
];

/** Maquiagem: o delineado, a sombra, o batom, o blush — do dia a dia ao carregado. */
export const DELINEADOS_13: { id: string; nome: string }[] = [
  { id: 'fino', nome: 'Delineado fino' }, { id: 'gatinho', nome: 'Gatinho (ponta puxada)' }, { id: 'carregado', nome: 'Carregado (em volta do olho)' }
];
export const CORES_DE_SOMBRA_13: Record<string, [string, string]> = {
  marrom: ['Marrom', '#8a5a44'], nude: ['Nude', '#c79a83'], esfumado: ['Esfumado (preto)', '#3a3236'], dourado: ['Dourado', '#c9a24a'],
  azul: ['Azul', '#4d6fb0'], verde: ['Verde', '#5d8a5a'], roxo: ['Roxo', '#7b5aa6'], rosa: ['Rosa', '#d58aa0']
};
export const CORES_DE_BATOM_13: Record<string, [string, string]> = {
  nude: ['Nude', '#b97f72'], rosa: ['Rosa', '#d0657f'], vermelho: ['Vermelho', '#b3202f'], vinho: ['Vinho', '#6e1f33'],
  coral: ['Coral', '#e0705a'], marrom: ['Marrom', '#7a4434'], roxo: ['Roxo', '#5a2a5e'], preto: ['Preto', '#1d1a1c']
};
export const BLUSHES_13: Record<string, [string, string]> = { rosado: ['Rosado', '#e58a99'], pessego: ['Pêssego', '#eba17d'], terracota: ['Terracota', '#c06a4e'] };
