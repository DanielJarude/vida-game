/**
 * VIDA 38 · tutorial da primeira entrada. Aparece uma vez por navegador, com a opção de pular em qualquer passo.
 * Preferência só deste navegador (localStorage): não entra no save nem muda a vida. Se o armazenamento não estiver
 * disponível (janela privada, dados bloqueados), o tutorial não aparece — o jogo funciona igual.
 */
import { useState } from 'react';
import './primeiraEntrada.css';

const CHAVE = 'vida.tutorial.primeiraEntrada.v1';

function jaVisto(): boolean {
  try { return window.localStorage.getItem(CHAVE) === '1'; } catch { return true; }
}
function marcarVisto(): void {
  try { window.localStorage.setItem(CHAVE, '1'); } catch { /* sem armazenamento: o tutorial volta na próxima vez, sem problema */ }
}

export const PASSOS_DO_TUTORIAL: { titulo: string; texto: string }[] = [
  { titulo: 'Sua vida passa ano a ano', texto: 'Cada ano tem escolhas e acontecimentos. O que você faz aparece na História, a linha do tempo da sua vida.' },
  { titulo: 'Seis áreas, no topo', texto: 'História, Você, Pessoas, Caminhos, Minha Semana e Vida. Cada uma responde a uma pergunta: quem sou, com quem vivo, o que faço, como uso o tempo, onde moro.' },
  { titulo: 'Tudo pesa', texto: 'Dinheiro, horas da semana e humor andam juntos. Antes de confirmar uma escolha, o jogo mostra o que ela custa.' },
  { titulo: 'Você decide o ritmo', texto: 'Pode pular este tutorial a qualquer momento. Ele não volta sozinho.' },
];

export function PrimeiraEntrada() {
  const [aberto, setAberto] = useState(() => !jaVisto());
  const [passo, setPasso] = useState(0);
  if (!aberto) return null;
  const ultimo = passo === PASSOS_DO_TUTORIAL.length - 1;
  const fechar = () => { marcarVisto(); setAberto(false); };
  const p = PASSOS_DO_TUTORIAL[passo];
  return (
    <div className="primeira-entrada" role="dialog" aria-modal="true" aria-labelledby="pe-titulo">
      <div className="primeira-entrada__cartao">
        <p className="primeira-entrada__passo">{passo + 1} de {PASSOS_DO_TUTORIAL.length}</p>
        <h2 id="pe-titulo">{p.titulo}</h2>
        <p>{p.texto}</p>
        <div className="primeira-entrada__acoes">
          <button type="button" className="primeira-entrada__pular" onClick={fechar}>Pular tutorial</button>
          {passo > 0 && <button type="button" onClick={() => setPasso(passo - 1)}>Voltar</button>}
          <button type="button" className="primeira-entrada__avancar" onClick={() => (ultimo ? fechar() : setPasso(passo + 1))}>
            {ultimo ? 'Começar' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
}
