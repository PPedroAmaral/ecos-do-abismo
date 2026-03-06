// src/data/spells.js
export const spells = {
    fogo_fatuo: {
        id: 'fogo_fatuo',
        name: 'Fogo Fátuo',
        type: 'ataque',
        mpCost: 10,
        damage: '2d4',
        description: 'Lança uma chama arcana contra o inimigo. (Dano baseado em INT)'
    },
    cura_menor: {
        id: 'cura_menor',
        name: 'Cura Menor',
        type: 'cura',
        mpCost: 15,
        heal: '2d8',
        description: 'Envolve o corpo em luz, recuperando Vida. (Cura baseada em INT)'
    }
};