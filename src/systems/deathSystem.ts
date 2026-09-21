import { CareerState, Character, EducationState, FamilyMember, PostMortemSummary } from '../types';
import { getEducationLabel } from '../utils/formatters';
import { gerarResumoMorte } from '../utils/narrativeGenerator';
import { rollChance } from '../utils/random';

export function verificarMortalidade(
  personagem: Character
): {
  morreu: boolean;
  causaMorte: string;
} {
  const idade = personagem.idade;
  const saude = personagem.stats.saude;

  // Morte direta por saúde zerada
  if (saude <= 0) {
    return {
      morreu: true,
      causaMorte: 'Complicações graves de saúde e falência múltipla de órgãos'
    };
  }

  // ------------------------------------------------- Curva de longevidade
  //
  // A curva entre 80 e 100 foi suavizada depois de uma medição: com o
  // desgaste de saúde anterior, 60 vidas simuladas tinham mediana de morte
  // aos 80 e NENHUMA passava dos 87. Consertado o envelhecimento (ver
  // `attributeSystem.calcularResiliencia`), a mediana subiu para 82 e o
  // teto para 90 — mas ainda era um teto: o conteúdo escrito para 90+
  // simplesmente nunca era alcançado por ninguém.
  //
  // A suavização é modesta e continua vigiada pelo fator de saúde, que é o
  // que faz a diferença entre trajetórias: chegar aos 85 com saúde 70 é
  // muito diferente de chegar com 30. Envelhecer bem passou a comprar anos
  // de verdade, em vez de só adiar a mesma conta.
  if (idade >= 70) {
    let chanceMorte = 0;
    if (idade < 80) chanceMorte = (idade - 70) * 0.8;
    else if (idade < 90) chanceMorte = 7 + (idade - 80) * 1.8;
    else if (idade < 100) chanceMorte = 25 + (idade - 90) * 4.5;
    else chanceMorte = 85;

    const fatorSaude = (100 - saude) / 50;
    chanceMorte *= Math.max(0.3, fatorSaude);

    if (rollChance(chanceMorte)) {
      let causa = 'Causas naturais e velhice pacífica';
      if (saude < 30) causa = 'Parada cardiorrespiratória em decorrência da idade';
      return { morreu: true, causaMorte: causa };
    }
  }

  // Doenças críticas
  if (personagem.doencas.length > 2 && saude < 20 && rollChance(15)) {
    return {
      morreu: true,
      causaMorte: 'Complicações agudas decorrentes de múltiplas enfermidades'
    };
  }

  return { morreu: false, causaMorte: '' };
}

export function construirResumoMorte(
  personagem: Character,
  familia: FamilyMember[],
  carreira: CareerState,
  educacao: EducationState,
  patrimonioFinal: number,
  causaMorte: string
): PostMortemSummary {
  const cargo = carreira.cargoAtual?.titulo || (carreira.aposentado ? 'Aposentado(a)' : 'Sem profissão fixa');
  const eduLabel = getEducationLabel(educacao.nivelAtual);

  return gerarResumoMorte(
    personagem,
    familia,
    personagem.stats,
    patrimonioFinal,
    cargo,
    eduLabel,
    causaMorte
  );
}
