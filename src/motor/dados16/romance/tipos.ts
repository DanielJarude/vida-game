/**
 * VIDA 16 · O RASTRO DO APLICATIVO — o que fica guardado quando alguém comprometido usa o aplicativo de namoro
 * (`Celular15.rastro16`, opcional). Não é punição: é o que existe para ser achado (o aplicativo instalado, as curtidas,
 * as conversas, o encontro). A parceria pode nunca ver nada.
 */
export type ProvaDoApp16 = 'perfil' | 'match' | 'mensagens' | 'encontro';

export interface RastroDoApp16 {
  /** A parceria de quando o rastro começou (outra parceria não herda o rastro). */
  parId: string;
  /** O que existe para ser achado, com quem (o perfil não tem "com"). */
  provas: { tipo: ProvaDoApp16; t: number; com?: string }[];
  /** As descobertas já feitas (quantas, a última e o que ela achou). */
  descobertas?: { t: number; tipo: ProvaDoApp16; desfecho: Desfecho16 }[];
}

/** O que a descoberta virou: do ciúme ao fim, passando pela conversa difícil. */
export type Desfecho16 = 'ciume' | 'discussao' | 'crise' | 'afastamento' | 'termino';
