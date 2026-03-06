// src/data/enemies.js
export const enemies = {
    // --- ÁREA 1: ESGOTOS ---
    rato_mutante: {
        id: 'rato_mutante',
        name: 'Rato Mutante',
        area: 'esgotos',
        maxHp: 15,
        ac: 12,
        damage: '1d4+1',
        xpReward: 10,
        isBoss: false,
        drops: ['adaga_ferrugem', 'trapos'] 
    },
    gosma_toxica: {
        id: 'gosma_toxica',
        name: 'Gosma Tóxica',
        area: 'esgotos',
        maxHp: 22,
        ac: 10,
        damage: '1d6',
        xpReward: 15,
        isBoss: false,
        drops: ['sal_refinado', 'pocao_vida'] 
    },
    vigilante_lodo: {
        id: 'vigilante_lodo',
        name: 'Vigilante de Lodo',
        area: 'esgotos',
        maxHp: 60,
        ac: 14,
        damage: '1d8+2',
        xpReward: 100,
        isBoss: true,
        drops: ['pingente_elara']
    },

    // --- ÁREA 2: BIBLIOTECA ---
    espectro_leitor: {
        id: 'espectro_leitor',
        name: 'Espectro Leitor',
        area: 'biblioteca',
        maxHp: 25,
        ac: 14,
        damage: '1d4+3',
        xpReward: 25,
        isBoss: false,
        drops: ['pergaminho_perdido', 'cajado_esmeralda'] 
    },
    
};