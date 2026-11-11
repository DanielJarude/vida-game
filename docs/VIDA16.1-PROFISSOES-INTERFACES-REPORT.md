# VIDA 16.1 — Profissões por dentro e rework visual das áreas (relatório)

Branch `claude/vida16.1-profissoes-interfaces` (base: VIDA 16 publicada, `0d63b60`). Um agente só. Notas de versão: `'16.1'`.

## Profissões
A auditoria confirmou: as cinco só tinham o desafio genérico de `conteudo/oficios` (uma ou duas frases, escolha de área e conta própria). Nenhum outro sistema cobria a rotina delas.

Todas usam a mesma pasta do ano da VIDA 16, mas cada uma tem mecânica e estado próprios (`motor/v16/oficios/oficios16b.ts`).

| Profissão | Estado que persiste | Decisões e consequências |
|---|---|---|
| Engenharia | Obras entregues com **risco latente** | Padrão de execução (enxugar, norma, reforçar); imprevistos (solo, chuva, fornecedor, erro de projeto: aditivo, improviso, refazer); a ART assinada sem acompanhar; anos depois, a **patologia** da obra (assumir ou contestar, com processo no conselho) |
| Enfermagem | **Sobrecarga** que atravessa os anos; plantões da carreira | Escala (diurno, noturno, dobras: dinheiro × cansaço; afastamento no limite); triagem (protocolo, olho, médico); quase-erro de medicação (notificar ou calar); prescrição duvidosa; família do paciente; escala furada |
| Contabilidade | **Carteira** (clientes, perdidos, multas) | Tamanho da carteira × risco de perder prazo fiscal; nota fria (orientar, omitir com risco no conselho, renunciar); planejamento tributário (legal × agressivo, que volta como autuação em até 5 anos); malha fina; honorários por conta própria |
| Jornalismo | **Credibilidade** (não é audiência); fontes | Linha do ano; pautas (publicar logo, apurar a fundo, descartar), decididas na virada (repercussão, MP, prêmio, ou correção e processo); fonte com documentos; pressão do anunciante |
| Psicologia | **Pacientes** que continuam de um ano para o outro (evolução, alta, abandono, encaminhamento) | Agenda (com supervisão paga, regular, cheia); continuar, intensificar, encaminhar à psiquiatria, dar alta; sigilo diante de risco a terceiros (limite do código de ética); limites da relação terapêutica |

- Os feitos vão para a trajetória e, quando importam, para a Linha da Vida e as marcas da carreira.
- Progressão, salário, áreas e conta própria seguem como já eram.

## Interfaces (as dez áreas)
1. **Navegação**
   - Em Vida, a cabeça da área não se repete mais inteira em cada seção: vira uma faixa (o "Há pouco" fica em Casa).
   - As abas de Vida ganharam ícones.
   - No computador, as abas de Vida, Pessoas e Você ficam presas sob o topo enquanto se rola. No celular, continuam na grade, sem prender.
2. **Você**: o perfil numa peça só — capa, retrato sobreposto, a ficha (dinheiro, o que é seu, cidade) e os números da vida social.
3. **Fama**: capa de revista (*Holofote*), com edição do ano, nota e a manchete do último marco real.
4. **Lojas**: cada segmento mostra a fachada real do seu primeiro lugar aberto. Filtros, busca e compras não mudaram.
5. **Guarda-roupa / provador**: o retrato e o corpo ficam num provador preso ao lado das escolhas (cortina e piso).
6. **Garagem**: showroom escuro com luz; a garagem vazia tem estado próprio.
7. **Casa**: a casa sobre a planta (grade de projeto), com a placa ao lado e a ilustração ocupando a coluna.
8. **Viagens**: passaporte (de onde parte, viagens registradas, carimbos só dos países de fato visitados); cada experiência é um bilhete com canhoto.
9. **Estudos**: carteirinha de estudante (a formação de agora, diplomas, anos letivos, processos seletivos).
10. **Esportes**: o crachá do atleta virou placar e aparece também em Outros caminhos.

Nada usa dado fictício: sem dado, a capa encolhe ou mostra um estado vazio dito como tal.

## Testes
- Novos: `vida161Profissoes` (6), `vida161Telas` (3, jsdom, com interação).
- **Suíte completa**: 2676 aprovados, 3 falhas.
  - Preexistentes: `motor.test` "regra de agência" e `rework115Esportes` (copas de quadra), ambas por tempo sob carga e já listadas na VIDA 14/15. A segunda passa sozinha com tempo maior.
  - `rework106` (notas sem "Correções") foi corrigido nas notas e passa.
- Simulação de 10 anos nas oito profissões com pasta, com escolhas aleatórias: sem erro nem invariante violada.
- **Typecheck** limpo; **build** com todos os pacotes abaixo de 800 kB (`motor-dados` 799,76, inalterado; `motor16-oficios` 46,3); **smoke** 25/25.
- **Visual no jogo real** (preview do build):
  - 1440, 390 e 360 px, claro e escuro: Você, Fama, Compras, Casa, Viagens, Patrimônio/Garagem (vazia e com 5 motos), Aparência, Estudos, Outros caminhos (atleta) e a pasta da enfermeira.
  - Nenhuma rolagem lateral nem erro de console.
  - Corrigido no caminho: o texto do perfil sobreposto, a ficha duplicada, as abas presas no celular, o contraste dos títulos no placar.

## Saves
- Campos novos opcionais em `Vida.oficio16`: plano, obras, sobrecarga, plantoes, carteira, credibilidade, fontes, pacientes, altas.
- Saves antigos (VIDA 11.5, 12.9 e 15) abriram no jogo real sem erro.

## Pendências
- O guarda-roupa por estilo e ocasião (dentro de Personalizar) ganhou só o provador; a lista de peças manteve o layout.
- Pessoas, Minha Semana e História receberam apenas a navegação (abas presas no computador).
