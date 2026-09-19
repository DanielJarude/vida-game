import { EducationLevel, LifeLogCategory, LifeStage, RelationType, SocialClass } from '../types';

// Formatador único reutilizado (criar Intl a cada chamada custa ~16× mais)
const FORMATADOR_BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0
});

export function formatarDinheiro(valor: number): string {
  const isNegative = valor < 0;
  const formatted = FORMATADOR_BRL.format(Math.abs(valor));
  return isNegative ? `-${formatted}` : formatted;
}

export function formatarIdade(idade: number): string {
  if (idade === 0) return 'Recém-nascido (0 anos)';
  if (idade === 1) return '1 ano';
  return `${idade} anos`;
}

export function getLifeStage(idade: number): LifeStage {
  if (idade <= 5) return 'primeira_infancia';
  if (idade <= 11) return 'infancia';
  if (idade <= 17) return 'adolescencia';
  if (idade <= 29) return 'jovem_adulto';
  if (idade <= 59) return 'adulto';
  return 'terceira_idade';
}

export function getLifeStageLabel(stage: LifeStage): string {
  switch (stage) {
    case 'primeira_infancia': return 'Primeira Infância';
    case 'infancia': return 'Infância';
    case 'adolescencia': return 'Adolescência';
    case 'jovem_adulto': return 'Jovem Adulto';
    case 'adulto': return 'Adulto';
    case 'terceira_idade': return 'Terceira Idade';
  }
}

export function getEducationLabel(nivel: EducationLevel): string {
  switch (nivel) {
    case 'nenhuma': return 'Sem escolaridade';
    case 'fundamental_incompleto': return 'Ensino Fundamental Incompleto';
    case 'fundamental_completo': return 'Ensino Fundamental Completo';
    case 'medio_incompleto': return 'Ensino Médio Incompleto';
    case 'medio_completo': return 'Ensino Médio Completo';
    case 'tecnico': return 'Ensino Técnico';
    case 'superior_incompleto': return 'Ensino Superior Incompleto';
    case 'superior_completo': return 'Ensino Superior Completo';
    case 'pos_graduacao': return 'Pós-Graduação / Especialização';
  }
}

export function getSocialClassLabel(classe: SocialClass): string {
  switch (classe) {
    case 'vulneravel': return 'Classe Baixa';
    case 'trabalhadora': return 'Classe Trabalhadora';
    case 'classe_media_baixa': return 'Classe Média Baixa';
    case 'classe_media': return 'Classe Média';
    case 'classe_alta': return 'Classe Alta';
  }
}

export function getStatColor(value: number): string {
  if (value >= 75) return '#10b981'; // Green
  if (value >= 50) return '#3b82f6'; // Blue
  if (value >= 25) return '#f59e0b'; // Amber / Orange
  return '#ef4444'; // Red
}

export function getStatClass(value: number): string {
  if (value >= 75) return 'stat-high';
  if (value >= 50) return 'stat-med-high';
  if (value >= 25) return 'stat-med-low';
  return 'stat-low';
}

// Rótulos em pt-BR exibidos ao jogador (nunca usar identificadores crus na interface)

export function getRotuloCategoria(categoria: LifeLogCategory): string {
  switch (categoria) {
    case 'geral': return 'Geral';
    case 'familia': return 'Família';
    case 'escola': return 'Escola';
    case 'carreira': return 'Carreira';
    case 'amor': return 'Amor';
    case 'saude': return 'Saúde';
    case 'financas': return 'Finanças';
    case 'evento': return 'Evento';
    case 'morte': return 'Morte';
    case 'cotidiano': return 'Cotidiano';
  }
}

export function getRotuloParentesco(tipo: RelationType): string {
  switch (tipo) {
    case 'pai': return 'Pai';
    case 'mae': return 'Mãe';
    case 'irmao': return 'Irmão';
    case 'irma': return 'Irmã';
    case 'namorado': return 'Namorado';
    case 'namorada': return 'Namorada';
    case 'noivo': return 'Noivo';
    case 'noiva': return 'Noiva';
    case 'esposo': return 'Esposo';
    case 'esposa': return 'Esposa';
    case 'filho': return 'Filho';
    case 'filha': return 'Filha';
    case 'amigo': return 'Amigo';
    case 'amiga': return 'Amiga';
    case 'pet': return 'Pet';
  }
}

/** Tratamento com artigo/possessivo para frases narrativas: "seu pai", "sua mãe"... */
export function getTratamentoParentesco(tipo: RelationType): string {
  switch (tipo) {
    case 'pai': return 'seu pai';
    case 'mae': return 'sua mãe';
    case 'irmao': return 'seu irmão';
    case 'irma': return 'sua irmã';
    case 'namorado': return 'seu namorado';
    case 'namorada': return 'sua namorada';
    case 'noivo': return 'seu noivo';
    case 'noiva': return 'sua noiva';
    case 'esposo': return 'seu esposo';
    case 'esposa': return 'sua esposa';
    case 'filho': return 'seu filho';
    case 'filha': return 'sua filha';
    case 'amigo': return 'seu amigo';
    case 'amiga': return 'sua amiga';
    case 'pet': return 'seu pet';
  }
}

export function getRotuloAtributo(atributo: string): string {
  switch (atributo) {
    case 'felicidade': return 'Felicidade';
    case 'saude': return 'Saúde';
    case 'inteligencia': return 'Inteligência';
    case 'aparencia': return 'Aparência';
    case 'disciplina': return 'Disciplina';
    case 'sociabilidade': return 'Sociabilidade';
    case 'empatia': return 'Empatia';
    case 'ambicao': return 'Ambição';
    case 'estresse': return 'Estresse';
    case 'reputacao': return 'Reputação';
    case 'condicionamentoFisico': return 'Condicionamento Físico';
    default: return atributo;
  }
}

export function getRotuloPosturaEscolar(postura: 'estudar' | 'matar_aula' | 'socializar'): string {
  switch (postura) {
    case 'estudar': return 'Estudar firme';
    case 'matar_aula': return 'Matar aula';
    case 'socializar': return 'Socializar';
  }
}
