/**
 * O motor, carregado sob demanda (um pacote à parte). Depois da primeira
 * carga, `motorCarregado()` devolve o módulo de forma síncrona.
 *
 * PWA: além da fachada, vem o `interpretar` do save — a validação e a
 * migração de um save cru, que a camada de persistência (ui/persistencia)
 * usa para abrir o que leu do IndexedDB. Os dois moram no mesmo pacote do
 * motor: nenhum pedido a mais.
 *
 * MUNDO: os pacotes de países (um por região, `motor/mundo/carregar`) chegam
 * junto, antes de o motor ser dado como pronto — um save de alguém que mora
 * em Lisboa só abre com Portugal no registro. O service worker guarda todos
 * eles: sem internet, vêm do cache. Uma região que falhe não impede o jogo
 * (o Brasil está sempre presente); `regioesQueFaltam` diz quais.
 */
export type Motor = typeof import('../motor/fachada') & Pick<typeof import('../motor/save'), 'interpretar'>;

let cache: Motor | null = null;
/** As regiões do mundo que não carregaram (sem rede e sem cache). */
export let regioesQueFaltam: string[] = [];
let promessa: Promise<Motor> | null = null;

export const motorCarregado = (): Motor | null => cache;
export function carregarMotor(): Promise<Motor> {
  return (promessa ??= Promise.all([import('../motor/fachada'), import('../motor/save'), import('../motor/mundo/carregar').then(m => m.carregarMundo())])
    .then(([f, s, falhas]) => { regioesQueFaltam = falhas; return (cache = { ...f, interpretar: s.interpretar }); }));
}
