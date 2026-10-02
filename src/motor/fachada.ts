/**
 * A fachada do motor para a interface: o que o controle da vida (`ui/useVida`)
 * chama. Existe para o motor inteiro poder ser carregado SOB DEMANDA
 * (`import()`), fora do pacote inicial — a primeira tela abre só com o React
 * e a interface, e o motor chega em seguida.
 */
export { criarVida, type OpcoesCriacao } from './criacao';
export { avancarAno } from './ano';
export { executar } from './acoes';
export { apagarSave, exportarVida, importarVida, ler, lerEstatisticas, registrarVidaPassada, salvar } from './save';
export { idade } from './nucleo';
export { patrimonio } from './sistemas/dinheiro';
export { nomeLugar } from './dados/lugares';
export { descricaoEmprego } from './sistemas/trabalho';
export { anoDe } from './tempo';
export { continuarComo, decidirHeranca, encerrarHistoria } from './sistemas/sucessao';
