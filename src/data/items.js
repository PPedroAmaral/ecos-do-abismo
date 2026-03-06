export const items = {
  // --- ARMAS ---
    adaga_ferrugem: {
        id: 'adaga_ferrugem',
        name: 'Adaga Enferrujada',
        type: 'arma_leve',
        damage: '1d4',
        bonusAttr: 'destreza',
        requirements: { destreza: 10 },
        description: 'Uma lâmina velha, mas rápida. Dobra a chance de acerto crítico.'
    },
    machado_lenhador: {
        id: 'machado_lenhador',
        name: 'Machado Pesado',
        type: 'arma_pesada',
        damage: '1d8',
        bonusAttr: 'forca',
        requirements: { forca: 14 },
        description: 'Causa dano massivo, mas exige muita força para empunhar.'
    },
    cajado_aprendiz: {
        id: 'cajado_aprendiz',
        name: 'Cajado de Aprendiz',
        type: 'arma_magica',
        damage: '1d6',
        bonusAttr: 'inteligencia',
        requirements: { inteligencia: 12 },
        description: 'Canaliza energia arcana básica.'
    },

    // --- ARMADURAS ---
    trapos: {
        id: 'trapos',
        name: 'Trapos de Prisioneiro',
        type: 'armadura_leve',
        defense: 1,
        requirements: {},
        description: 'Oferece quase nenhuma proteção.'
    },
    couro_reforcado: {
        id: 'couro_reforcado',
        name: 'Armadura de Couro',
        type: 'armadura_leve',
        defense: 3,
        requirements: { destreza: 12 },
        description: 'Leve e flexível, permite desviar de ataques.'
    },
    cota_malha: {
        id: 'cota_malha',
        name: 'Cota de Malha Velha',
        type: 'armadura_pesada',
        defense: 5,
        requirements: { forca: 15 },
        description: 'Pesada e barulhenta, mas absorve bons golpes.'
    },

    // --- ITENS DE QUEST E CONSUMÍVEIS ---
    pocao_vida: {
        id: 'pocao_vida',
        name: 'Poção de Vida',
        type: 'consumivel',
        effect: { healHp: 15 },
        description: 'Restaura 15 HP.'
    },
    martelo_brasas: {
        id: 'martelo_brasas',
        name: 'Martelo de Brasas',
        type: 'quest',
        description: 'O martelo perdido do ferreiro Valerius. Irradia calor.'
    },
    sal_refinado: {
        id: 'sal_refinado',
        name: 'Sal Refinado',
        type: 'consumivel_combate',
        description: 'Impede a regeneração de monstros de lodo.'
    }
};