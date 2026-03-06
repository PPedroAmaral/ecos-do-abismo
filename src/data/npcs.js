// src/data/npcs.js
export const npcs = {
    vane: {
        id: 'vane',
        name: 'Vane, o Assassino',
        area: 'esgotos',
        questItem: 'sal_refinado', // O ID do item que ele quer
        dialogue: {
        not_started: "As sombras deste esgoto escondem muitos segredos... Traga-me um pouco de 'Sal Refinado' dos monstros daqui e eu lhe ensinarei a bater onde dói.",
        active: "Ainda não encontrou o Sal? Procure nos restos daquelas gosmas tóxicas. Eu espero.",
        completed: "Excelente. Como prometido, você tem o toque da morte agora. Seus golpes críticos serão letais."
        },
        rewardText: "Desbloqueou: +10% Chance de Crítico Permanente!"
    }
};