import { useEffect, useRef } from 'react';

interface ModalBehaviorOptions {
  /** Chamado ao pressionar Escape. Omitir quando o modal for obrigatório. */
  onClose?: () => void;
}

/**
 * Comportamento acessível compartilhado por todos os modais:
 *
 * - move o foco para dentro do diálogo ao abrir;
 * - mantém o foco preso (Tab e Shift+Tab circulam dentro do diálogo);
 * - fecha no Escape quando o modal é dispensável;
 * - devolve o foco ao elemento que abriu o modal;
 * - impede a rolagem do fundo enquanto está aberto.
 */
export function useModalBehavior<T extends HTMLElement>({
  onClose
}: ModalBehaviorOptions = {}) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elementoAnterior = document.activeElement as HTMLElement | null;

    const focaveis = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => el.offsetParent !== null || el === document.activeElement);

    // Foco inicial: o primeiro controle utilizável, ou o próprio diálogo.
    const iniciais = focaveis();
    if (iniciais.length > 0) {
      iniciais[0].focus();
    } else {
      container.focus();
    }

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape' && onClose) {
        evento.stopPropagation();
        onClose();
        return;
      }

      if (evento.key !== 'Tab') return;

      const lista = focaveis();
      if (lista.length === 0) {
        evento.preventDefault();
        return;
      }

      const primeiro = lista[0];
      const ultimo = lista[lista.length - 1];
      const atual = document.activeElement;

      if (evento.shiftKey && (atual === primeiro || !container.contains(atual))) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && atual === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener('keydown', aoTeclar, true);

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', aoTeclar, true);
      document.body.style.overflow = overflowAnterior;
      elementoAnterior?.focus?.();
    };
  }, [onClose]);

  return containerRef;
}
