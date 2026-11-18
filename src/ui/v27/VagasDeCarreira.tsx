/**
 * VIDA 27 · §14 — as vagas de carreira: quais carreiras profissionais estão ocupando as duas vagas (e que hobby,
 * formação e o que já acabou não ocupam). O motor é `motor/sistemas/vagasDeCarreira`.
 */
import type { Vida } from '../../motor/tipos';
import { carreirasAtivas, LIMITE_DE_CARREIRAS } from '../../motor/sistemas/vagasDeCarreira';

const TIPO = { principal: 'principal', paralela: 'em paralelo', negocio: 'negócio nas horas vagas' } as const;

export function VagasDeCarreira({ vida }: { vida: Vida }) {
  const cs = carreirasAtivas(vida);
  if (!cs.length) return null;
  return (
    <p className="nota vagas27" data-vagas={cs.length}>
      <strong>Carreiras profissionais: {cs.length} de {LIMITE_DE_CARREIRAS}</strong> — {cs.map(c => `${c.nome} (${TIPO[c.tipo]})`).join('; ')}.
      {cs.length >= LIMITE_DE_CARREIRAS ? ' Para começar outra, deixe uma destas; o histórico fica.' : ' Cabe mais uma.'} Hobby, formação e carreira pausada não ocupam vaga.
    </p>
  );
}
