/** VIDA 12.5 — os ícones das categorias de memória (a Retrospectiva e a celebração do ano que passou). */
import type { CategoriaDaMemoria } from '../../motor/sistemas/albumDaVida';

/** Os ícones por categoria (traço simples, 24 × 24, na cor da categoria). */
const ICONE: Record<CategoriaDaMemoria, string> = {
  familia: 'M4 11l8-6 8 6v8H4z M10 19v-5h4v5',
  relacionamentos: 'M12 19s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 7.6a3.8 3.8 0 0 1 7 2.2C19 14.6 12 19 12 19z',
  educacao: 'M3 9l9-4 9 4-9 4z M7 11v4c3 2 7 2 10 0v-4',
  carreira: 'M4 9h16v10H4z M9 9V6h6v3 M4 13h16',
  esportes: 'M8 4h8v4a4 4 0 0 1-8 0z M8 6H5a3 3 0 0 0 3 4 M16 6h3a3 3 0 0 1-3 4 M12 12v4 M8 20h8 M10 16h4',
  patrimonio: 'M3 12l9-7 9 7 M6 10v9h12v-9 M10 19v-4h4v4',
  viagens: 'M3 15l18-6-4 9-5-3-3 4v-5l9-5',
  conquistas: 'M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z',
  momentos: 'M12 4v3 M12 17v3 M4 12h3 M17 12h3 M6.3 6.3l2.1 2.1 M15.6 15.6l2.1 2.1 M6.3 17.7l2.1-2.1 M15.6 8.4l2.1-2.1 M12 9a3 3 0 1 1 0 6a3 3 0 0 1 0-6z'
};

export function IconeDaMemoria({ categoria, tamanho = 22 }: { categoria: CategoriaDaMemoria; tamanho?: number }) {
  return (
    <svg className="retro-icone" viewBox="0 0 24 24" width={tamanho} height={tamanho} aria-hidden="true" focusable="false">
      <path d={ICONE[categoria]} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
