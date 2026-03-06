import { createContext, useContext, useState } from "react";
import { items } from "../data/items";

const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const [player, setPlayer] = useState({
        name: "Aventureiro",
        level: 1,
        xp: 0,
        statPoints: 0,
        currentHp: 102,
        currentMp: 53,
        attributes: {
            forca: 10,
            destreza: 10,
            inteligencia: 10,
            vigor: 10,
            presenca: 10,
        },
        levelAllocations: {
            forca: 0,
            destreza: 0,
            inteligencia: 0,
            vigor: 0,
            presenca: 0
        },
        equipment: {
            weapon: items.adaga_ferrugem,
            armor: items.trapos
        },
        knownSpells: ['fogo_fatuo', 'cura_menor']
    })

    const [inventory, setInventory] = useState([])
    const MAX_INVENTORY_SLOTS = 10

    const [quests, setQuests] = useState({
        vane: 'not_started',    // Pode ser: 'not_started', 'active', 'completed'
        valerius: 'not_started', // Para quando criarmos o Ferreiro
        kaelen: 'not_started'
    });

    const maxHp = (player.attributes.vigor * 10) + (player.level * 2)
    const maxMp = (player.attributes.presenca * 5) + (player.level * 3)

    const armorValue = player.equipment.armor ? player.equipment.armor.defense : 0
    const dexBonus = Math.floor((player.attributes.destreza - 8) / 2)
    const armorClass = 10 + armorValue + dexBonus 

    const [gameState, setGameState] = useState ({
        currentArea: 'esgotos',
        currentEvent: null,
        logs: ["Você acorda no fundo úmido dos Esgotos de Astraea..."]
    })

    const addLog = (message) => {
        setGameState(prev => ({
            ...prev,
            logs: [...prev.logs, message]
        }))
    }

    const checkRequirements = (item) => {
        if (!item || !item.requirements) return true;
        
        for (const [attr, value] of Object.entries(item.requirements)) {
        const attrKey = attr.toLowerCase(); 

        const playerStat = player.attributes[attrKey] || 0; 
        
        if (playerStat < value) {
            return false; 
        }
        }
        return true; 
    };

    const xpToNextLevel = player.level * 50;

    const gainXp = (amount) => {
        setPlayer(prev => {
        let newXp = prev.xp + amount;
        let newLevel = prev.level;
        let newPoints = prev.statPoints;
        let leveledUp = false;

        // Loop caso ganhe muito XP de uma vez e suba mais de um nível
        while (newXp >= newLevel * 50) {
            newXp -= newLevel * 50; 
            newLevel++;
            newPoints += 4; 
            leveledUp = true;
        }

        if (leveledUp) {
            addLog(`SUBIU DE NÍVEL! Você alcançou o Nível ${newLevel}.`);
            addLog(`Você tem ${newPoints} pontos de atributo para distribuir.`);
        }

        return {
            ...prev,
            xp: newXp,
            level: newLevel,
            statPoints: newPoints,
            // Cura total ao subir de nível
            currentHp: leveledUp ? (prev.attributes.vigor * 10) + (newLevel * 2) : prev.currentHp,
            currentMp: leveledUp ? (prev.attributes.presenca * 5) + (newLevel * 3) : prev.currentMp
        };
        });
    };

    
    const increaseAttribute = (attr) => {
        if (player.statPoints > 0) {
            if (player.levelAllocations[attr] >= 2) {
                addLog(`⚠️ Você já atingiu o limite de 2 pontos em ${attr} neste nível!`);
                return;
            }
            
            setPlayer(prev => {
                const newStatPoints = prev.statPoints - 1;

                const newAllocations = { 
                    ...prev.levelAllocations, 
                    [attr]: prev.levelAllocations[attr] + 1 
                };


                const finalAllocations = newStatPoints === 0 
                ? { forca: 0, destreza: 0, inteligencia: 0, vigor: 0, presenca: 0 }
                : newAllocations;

                return {
                    ...prev,
                    statPoints: newStatPoints,
                    attributes: {
                        ...prev.attributes,
                        [attr]: prev.attributes[attr] + 1
                    },
                    levelAllocations: finalAllocations
                };
            });
            
            addLog(`+1 em ${attr}!`);
        }
    };


    const addToInventory = (item) => {
        if (inventory.length >= MAX_INVENTORY_SLOTS) {
        addLog("A sua mochila está cheia! Precisa de deixar algo fora.");
        return false;
        }
        setInventory(prev => [...prev, item]);
        addLog(`Recebeu: ${item.name}!`);
        return true;
    };

    const equipItem = (item) => {
        if (!checkRequirements(item)) {
        addLog(`Você não tem os atributos necessários para equipar ${item.name}!`);
        return;
        }

        // Lógica à prova de erros de digitação (ignora underlines ou espaços)
        const isArmor = item.type.includes('armadura');
        const isWeapon = item.type.includes('arma') && !isArmor; // Garante que armadura não conte como arma

        if (!isWeapon && !isArmor) {
        addLog(`O item ${item.name} não pode ser equipado.`);
        return;
        }

        setPlayer(prev => {
        let newEquipment = { ...prev.equipment };
        
        if (isWeapon) newEquipment.weapon = item;
        if (isArmor) newEquipment.armor = item;

        return { ...prev, equipment: newEquipment };
        });
        
        addLog(`Equipou: ${item.name}.`);
    };

    const consumeItem = (item, index) => {
        if (!item?.type?.includes('consumivel')) {
        addLog(`❌ Você não pode usar ${item?.name} assim.`);
        return;
        }

        // Se o item tiver um efeito de cura de HP
        if (item.effect && item.effect.healHp) {
        setPlayer(prev => ({
            ...prev,
            // Garante que a cura não ultrapasse a Vida Máxima
            currentHp: Math.min(maxHp, prev.currentHp + item.effect.healHp)
        }));
        addLog(`🧪 Você bebeu ${item.name} e recuperou ${item.effect.healHp} HP!`);
        } else if (item.id === 'sal_refinado') {
        // Efeito narrativo do sal (depois podemos fazer dar dano no chefe de lodo)
        addLog(`🧂 Você espalha o ${item.name}. O ar fica mais seco ao seu redor.`);
        }

        // Após usar, o item some da mochila
        removeFromInventory(index);
    };

    const removeFromInventory = (index) => {
        setInventory(prev => prev.filter((_, i) => i !== index));
    };
    
    return (
        <GameContext.Provider value={{
            player,setPlayer,
            inventory, setInventory, MAX_INVENTORY_SLOTS,
            quests, setQuests,
            maxHp, maxMp, armorClass,
            gameState, setGameState, addLog,
            checkRequirements,
            xpToNextLevel, gainXp, increaseAttribute,
            addToInventory, equipItem, removeFromInventory,
            consumeItem
        }}>
            {children}
        </GameContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useGame = () => useContext(GameContext)