# 🗡️ Ecos do Abismo

> Um RPG de navegador focado em exploração, gestão de inventário e combate estratégico baseado em dados (d20), desenvolvido com React.

🔗 **Jogue agora:** [ecos-do-abismo.vercel.app](https://ecos-do-abismo.vercel.app/)

## 📜 Sobre o Projeto

"Ecos do Abismo" é um projeto de portfólio criado para demonstrar o domínio sobre o ecossistema React, com foco especial em **State Management** (Gestão de Estado) complexo, lógica de renderização condicional e arquitetura de componentes. 

O jogo desafia o jogador a explorar uma masmorra gerada de forma procedural em texto/UI, gerindo recursos vitais (HP/MP), otimizando a sua *build* de atributos e completando missões para NPCs.

## ✨ Funcionalidades Principais

* **Motor de Combate (d20 System):** Cálculos de acerto contra Classe de Armadura (CA), danos variáveis e magias de custo de Mana com efeitos diretos.
* **Sistema de Progressão:** Ganho de XP dinâmico com Level Up matemático. Distribuição de pontos de atributos (Força, Destreza, Inteligência, etc.) com limitadores lógicos para evitar *power-creeping*.
* **Inventário e Loot:** Tabela de *drops* específica por inimigo. Equipamento de itens com verificação de Requisitos de Atributos e consumo de poções de cura.
* **Máquina de Estado de NPCs (Quests):** Diálogos dinâmicos que se alteram conforme o estado da missão (não iniciada, ativa, concluída) e validação de itens no inventário para entrega.
* **Sistema de Loja (Mercador):** Geração aleatória de itens à venda com validação de compra baseada nas capacidades do jogador.
* **Áudio Imersivo:** Motor de áudio customizado separando BGM (Música de Fundo) dinâmica por área e SFX (Efeitos Sonoros) de combate.

## 🛠️ Tecnologias Utilizadas

* **[React 18](https://react.dev/):** Utilização intensiva de Hooks (`useState`, `useEffect`, `useRef`) e Custom Hooks (`useAudio`).
* **[Context API](https://react.dev/learn/passing-data-deeply-with-context):** `GameContext` atuando como a única fonte de verdade (Single Source of Truth) para o estado global do jogador, mochila e missões.
* **[Tailwind CSS](https://tailwindcss.com/):** Estilização utilitária para uma interface *dark mode* responsiva, com animações e *feedbacks* visuais de estado (ex: botões desativados).
* **[Howler.js](https://howlerjs.com/):** Biblioteca de áudio para gestão de múltiplas faixas e otimização de reprodução no navegador.
* **[Vite](https://vitejs.dev/):** Ferramenta de *build* super rápida para um ambiente de desenvolvimento ágil.

Desenvolvido com dedicação por Pedro.

##Jogo ainda não está finalizado 