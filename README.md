# VIDA — Simulador de Vida Brasileiro 🌱

Um simulador de vida web completo, moderno e autêntico, inspirado no gênero de simulações baseadas em escolhas, ambientado inteiramente na cultura, dinâmica socioeconômica e cidades do Brasil.

---

## 🚀 Tecnologias

- **React 19**
- **TypeScript 5**
- **Vite 6**
- **Lucide Icons**
- **CSS Modular e Responsivo** (Desktop & Mobile)
- **Web Audio API** para efeitos sonoros táteis e dinâmicos
- **LocalStorage API** para salvamento automático e Hall da Fama

---

## 🏛️ Arquitetura do Projeto

O projeto foi estruturado seguindo princípios de arquitetura limpa, desacoplada e orientada a dados para facilitar a adição de novos sistemas e conteúdos:

```
src/
├── types/                # Definições de tipos TypeScript (Character, Family, Career, etc.)
├── data/                 # Banco de dados e tabelas estáticas
│   ├── brazilianData.ts  # Cidades, estados, nomes, sobrenomes e classes sociais
│   ├── coursesData.ts    # Cursos superiores e técnicos, notas de corte ENEM
│   ├── careersData.ts    # Profissões CLT, concursos públicos e bicos
│   ├── assetsData.ts     # Imóveis, veículos e opções de investimento
│   ├── activitiesData.ts # Atividades de lazer, saúde, estética e autoconhecimento
│   └── events/           # Mais de 65 eventos orientados a dados por fase da vida
├── systems/              # Motores lógicos desacoplados da interface
│   ├── agingSystem.ts    # Orquestrador do avanço anual (+ 1 ANO)
│   ├── attributeSystem.ts# Normalização e desgaste/evolução de atributos
│   ├── eventSystem.ts    # Motor de avaliação e consequências de eventos
│   ├── familySystem.ts   # Geração familiar e interações interpessoais
│   ├── educationSystem.ts# Desempenho escolar, vestibular ENEM e faculdade
│   ├── careerSystem.ts   # Vagas, horas extras, promoções e demissões
│   ├── economySystem.ts  # Balanço financeiro, patrimônio e Mega-Sena
│   ├── relationshipSystem.ts # Namoro, casamento e filhos
│   ├── deathSystem.ts    # Curva de longevidade, mortalidade e biografia
│   └── saveSystem.ts     # Persistência no LocalStorage e Hall da Fama
├── utils/                # Formatadores, geradores de narrativa e áudio
├── hooks/                # Hook central useGame()
├── components/           # Componentes de interface e telas
│   ├── layout/           # Header, Sidebar de Atributos
│   ├── tabs/             # Linha da Vida, Relacionamentos, Carreira, Finanças, Atividades
│   ├── modals/           # EventModal, FamilyModal, JobMarketModal, AssetShopModal, DatingModal
│   └── screens/          # HomeScreen, CharacterCreationScreen, DeathScreen, StatsScreen
└── styles/               # Folhas de estilo responsivas
```

---

## 🎮 Sistemas Implementados

1. **Criação de Vida & Nascimento**:
   - Escolha de nome, sobrenome, gênero e cidade/estado de nascimento (ou geração 100% aleatória).
   - Geração dinâmica de pais, situação financeira familiar (Classe Baixa, Trabalhadora, Classe Média, Classe Alta) e atributos iniciais.

2. **Loop de Envelhecimento (+ 1 ANO)**:
   - Passagem do tempo com processamento simultâneo de saúde, educação, finanças, carreira, família e mortalidade.
   - Anos tranquilos geram crônicas narrativas naturais; anos agitados disparam eventos interativos.

3. **Atributos Visíveis & Internos**:
   - Visíveis: Felicidade, Saúde, Inteligência, Aparência, Energia (0-100).
   - Internos: Disciplina, Sociabilidade, Empatia, Ambição, Estresse, Reputação, Condicionamento Físico.

4. **Educação**:
   - Ensino Fundamental I & II, Ensino Médio.
   - Vestibular / ENEM com notas de corte para faculdades públicas (gratuitas) e particulares.
   - Ações: Estudar Firme, Socializar, Matar Aula.

5. **Carreira & Trabalho**:
   - Vagas de emprego CLT em múltiplos setores (Comércio, Tecnologia, Saúde, Engenharia, Direito, Concursos Públicos).
   - Ações: Horas extras, Pedir Aumento, Pedir Demissão, Bicos/Freelance.

6. **Família & Romance**:
   - Interações ricas com pais, irmãos, filhos e pets (Conversar, Passar Tempo, Presentear, Pedir Dinheiro, Discutir).
   - Aplicativo de encontros para namorar, propor casamento oficial e ter filhos.

7. **Economia & Bens**:
   - Salário mensal, despesas anuais por padrão de vida e dependentes.
   - Compra e venda de imóveis e veículos.
   - Investimentos (Poupança, Tesouro Selic, FIIs, Ações B3, Cripto).
   - Loteria Mega-Sena com sorteios e chances de ficar milionário.

8. **Morte & Obituário**:
   - Resumo completo da vida vivida, patrimônio final acumulado, causas de morte, biografia resumida e pontuação geral.
   - Registro permanente no Hall da Fama.

---

## 🛠️ Como Executar

```bash
npm install
npm run dev
```

Abra `http://localhost:5173` no navegador.
