import { useEffect, useRef, useState } from 'react';
import { useGame } from './context/GameContext';
import { Shield, Sword, Backpack, Footprints, Skull, MessageCircle } from 'lucide-react';
import { enemies } from './data/enemies';
import { rollDice, rollDamage } from './utils/dice'
import { items } from './data/items';
import { spells } from './data/spells';
import { npcs } from './data/npcs';
import { useAudio } from './hooks/useAudio';



function App() {
  const { player, setPlayer, maxHp, maxMp, armorClass, gameState, setGameState, addLog, gainXp, xpToNextLevel, increaseAttribute, addToInventory, equipItem, removeFromInventory, MAX_INVENTORY_SLOTS, inventory, checkRequirements, quests, setQuests, consumeItem } = useGame();

  const { playBGM, playSFX } = useAudio();
  useEffect(() => {
    playBGM(gameState.currentArea);
  }, [gameState.currentArea]);

  const logEndRef = useRef(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isMagicOpen, setIsMagicOpen] = useState(false)

  
  // eslint-disable-next-line react-hooks/immutability
  window.debugPlayer = player;

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.logs]);

  const handleExplore = () => {
    // Se já estivermos em combate, não podemos avançar
    if (gameState.currentEvent === 'combat') {
      addLog("Há um inimigo à sua frente! Não pode avançar agora.");
      return;
    }

    if (gameState.currentEvent === 'npc') {
      setGameState(prev => ({ ...prev, currentEvent: null, activeNpc: null }));
    }

    addLog("Você avança com cautela pela escuridão...");
    
    const encounterChance = rollDice(100);

    if (encounterChance <= 20) {
      const areaNpcs = Object.values(npcs).filter(n => n.area === gameState.currentArea);
      if (areaNpcs.length > 0) {
        setGameState(prev => ({
          ...prev,
          currentEvent: 'npc',
          activeNpc: areaNpcs[0] // Pega o primeiro NPC da área
        }));
        addLog(`👤 Uma figura encapuzada surge: é ${areaNpcs[0].name}.`);
        return;
      }
    }

    if (encounterChance > 20 && encounterChance <= 70) {
      const areaEnemies = Object.values(enemies).filter(e => e.area === gameState.currentArea && !e.isBoss);
      const randomEnemy = areaEnemies[Math.floor(Math.random() * areaEnemies.length)];

      setGameState(prev => ({
        ...prev,
        currentEvent: 'combat',
        activeEnemy: { ...randomEnemy, currentHp: randomEnemy.maxHp }
      }));
      addLog(`Um ${randomEnemy.name} salta das sombras! (CA: ${randomEnemy.ac})`);
    } else {
      addLog("Você encontra apenas poeira e ecos. A sala está segura por agora.");
    }
  };

  const handleAttack = () => {
    if (gameState.currentEvent != 'combat' || !gameState.activeEnemy) return;
    
    const enemy = gameState.activeEnemy;
    const weapon = player.equipment.weapon

    const attrKey = weapon ? weapon.bonusAttr : 'forca'
    const attrValue = player.attributes[attrKey]

    const attrBonus = Math.floor((attrValue - 8) / 2)

    const d20 = rollDice(20)
    const toHit = d20 + attrBonus + player.level

    addLog(`Total: ${toHit}`)

    if (toHit >= enemy.ac) {
      playSFX('attack');
      const baseDmg = weapon ? rollDamage(weapon.damage) : 1;
      const totalDamage = baseDmg + attrBonus + Math.floor(player.level / 2)

      addLog(`Acertou em cheio! Causou ${totalDamage} de dano ao ${enemy.name}.`)

      const newEnemyHp = enemy.currentHp - totalDamage;

      if (newEnemyHp <= 0) {
        addLog(`Derrotou o ${enemy.name}! Ganhou ${enemy.xpReward} XP.`)
        gainXp(enemy.xpReward);

        if (enemy.isBoss) {
          addLog(`O Guardião caiu! O portão para a próxima área está aberto!`);
          
          if (enemy.id === 'vigilante_lodo') {
            // Dropa o item da quest da Dama obrigatoriamente
            addToInventory(items.pingente_elara || { id: 'pingente_elara', name: 'Pingente de Elara', type: 'quest' });
            
            // Muda a área para a Biblioteca
            setGameState(prev => ({ 
              ...prev, 
              currentEvent: null, 
              activeEnemy: null,
              currentArea: 'biblioteca',
              logs: [...prev.logs, "Bem-vindo à Biblioteca Esquecida. O ar aqui cheira a pergaminho velho e magia instável."]
            }));
          }
          return;
        }

        if (enemy.drops && enemy.drops.length > 0) {
          // 50% de probabilidade de o monstro deixar cair algo da SUA lista
          if (rollDice(100) <= 50) {
            const randomDropId = enemy.drops[Math.floor(Math.random() * enemy.drops.length)];
            const droppedItem = items[randomDropId];
            
            if (droppedItem) {
              const success = addToInventory(droppedItem);
              if (success) {
                // Removemos o log antigo do addToInventory e colocamos um mais emocionante aqui
                addLog(`🎁 O ${enemy.name} deixou cair: ${droppedItem.name}!`);
              }
            }
          }
        } else {
          // Se o monstro não tiver lista específica, 20% de chance de cair uma poção de vida genérica
          if (rollDice(100) <= 20) {
              addToInventory(items.pocao_vida);
          }
        }

        setGameState(prev => ({...prev, currentEvent: null, activeEnemy:null}))
        return
      } else {
        setGameState(prev => ({
          ...prev,
          activeEnemy: { ...enemy, currentHp: newEnemyHp }
        }));
      }
    } else {
      addLog('O seu ataque passou ao lado!')
    }

    setTimeout(() => {
      // --- MECÂNICA DO CHEFE: REGENERAÇÃO ---
      if (enemy.id === 'vigilante_lodo' && enemy.currentHp > 0) {
        const healAmount = 5;
        setGameState(prev => {
          if (!prev.activeEnemy) return prev;
          return {
            ...prev,
            activeEnemy: { 
              ...prev.activeEnemy, 
              currentHp: Math.min(prev.activeEnemy.maxHp, prev.activeEnemy.currentHp + healAmount) 
            }
          };
        });
        addLog(`O lodo junta-se novamente... O Vigilante recuperou ${healAmount} HP!`);
      }

      // O Inimigo ataca
      const enemyD20 = rollDice(20);
      const enemyToHit = enemyD20 + 2; 
      
      if (enemyToHit >= armorClass) {
        const enemyDmg = rollDamage(enemy.damage);
        addLog(`O ${enemy.name} atacou! Sofreu ${enemyDmg} de dano.`);
        setPlayer(prev => ({ ...prev, currentHp: prev.currentHp - enemyDmg }));
      } else {
        addLog(`Esquivou-se do ataque do ${enemy.name}!`);
      }
    }, 300);
  }

  const handleCastSpell = (spellId) => {
    const spell = spells[spellId]

    if(player.currentMp < spells[spellId]) {
      addLog(`Mana insuficiente para conjurar ${spell.name}!`);
      return;
    }

    setPlayer(prev => ({ ...prev, currentMp: prev.currentMp - spell.mpCost }));

    const intBonus = Math.floor((player.attributes.inteligencia - 8) / 2)

    if(spell.type === 'cura') {
      playSFX(spellId);
      const healAmount = rollDamage(spell.heal) + intBonus
      setPlayer(prev => ({
        ...prev,
        currentHp: Math.min(maxHp, prev.currentHp + healAmount)
      }))
      addLog(`Você conjura ${spell.name} e recupera ${healAmount} de HP!`)
      setIsMagicOpen(false)
      return
    }

    if(spell.type === 'ataque') {
      if(gameState.currentEvent !== 'combat' || !gameState.activeEnemy) {
        addLog('Nenhum inimigo à vista para atacar!')
        return
      }

      playSFX(spellId)

      const enemy = gameState.activeEnemy;
      const spellDmg = rollDamage(spell.damage) + intBonus;
      
      addLog(`Você conjura ${spell.name}! Causa ${spellDmg} de dano ao ${enemy.name}.`)

      const newEnemyHp = enemy.currentHp - spellDmg

      if (newEnemyHp <= 0) {
        addLog(`💀 Derrotou o ${enemy.name}! Ganhou ${enemy.xpReward} XP.`);
        gainXp(enemy.xpReward);

        if (enemy.isBoss) {
          addLog(`O Guardião caiu! O portão para a próxima área está aberto!`);
          
          if (enemy.id === 'vigilante_lodo') {
            // Dropa o item da quest da Dama obrigatoriamente
            addToInventory(items.pingente_elara || { id: 'pingente_elara', name: 'Pingente de Elara', type: 'quest' });
            
            // Muda a área para a Biblioteca
            setGameState(prev => ({ 
              ...prev, 
              currentEvent: null, 
              activeEnemy: null,
              currentArea: 'biblioteca',
              logs: [...prev.logs, "Bem-vindo à Biblioteca Esquecida. O ar aqui cheira a pergaminho velho e magia instável."]
            }));
          }
          return;
        }
        
        // Loot
        if (enemy.drops && enemy.drops.length > 0) {
          // 50% de probabilidade de o monstro deixar cair algo da SUA lista
          if (rollDice(100) <= 50) {
            // eslint-disable-next-line react-hooks/purity
            const randomDropId = enemy.drops[Math.floor(Math.random() * enemy.drops.length)];
            const droppedItem = items[randomDropId];
            
            if (droppedItem) {
              const success = addToInventory(droppedItem);
              if (success) {
                // Removemos o log antigo do addToInventory e colocamos um mais emocionante aqui
                addLog(`🎁 O ${enemy.name} deixou cair: ${droppedItem.name}!`);
              }
            }
          }
        } else {
          // Se o monstro não tiver lista específica, 20% de chance de cair uma poção de vida genérica
          if (rollDice(100) <= 20) {
              addToInventory(items.pocao_vida);
          }
        }
        
        setGameState(prev => ({ ...prev, currentEvent: null, activeEnemy: null }));
      } else {
        // Atualiza a vida do monstro
        setGameState(prev => ({
          ...prev,
          activeEnemy: { ...enemy, currentHp: newEnemyHp }
        }));

        // Turno do Inimigo (Contra-ataque)
        setTimeout(() => {
      // --- MECÂNICA DO CHEFE: REGENERAÇÃO ---
      if (enemy.id === 'vigilante_lodo' && enemy.currentHp > 0) {
        const healAmount = 5;
        setGameState(prev => {
          if (!prev.activeEnemy) return prev;
          return {
            ...prev,
            activeEnemy: { 
              ...prev.activeEnemy, 
              currentHp: Math.min(prev.activeEnemy.maxHp, prev.activeEnemy.currentHp + healAmount) 
            }
          };
        });
        addLog(`O lodo junta-se novamente... O Vigilante recuperou ${healAmount} HP!`);
      }

      // O Inimigo ataca
      const enemyD20 = rollDice(20);
      const enemyToHit = enemyD20 + 2; 
      
      if (enemyToHit >= armorClass) {
        const enemyDmg = rollDamage(enemy.damage);
        addLog(`O ${enemy.name} atacou! Sofreu ${enemyDmg} de dano.`);
        setPlayer(prev => ({ ...prev, currentHp: prev.currentHp - enemyDmg }));
      } else {
        addLog(`Esquivou-se do ataque do ${enemy.name}!`);
      }
    }, 300);
      }
      setIsMagicOpen(false); // Fecha o modal
    }
  }

  // Define a cor de fundo temporária baseada na área atual
  const getAreaBackground = () => {
    switch(gameState.currentArea) {
      case 'esgotos': return 'bg-green-950';
      case 'biblioteca': return 'bg-blue-950';
      case 'forja': return 'bg-orange-950';
      case 'trono': return 'bg-purple-950';
      default: return 'bg-zinc-900';
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono text-zinc-300">
      
{/* Container Principal do Jogo (Estilo Monitor Retrô/Pergaminho) */}
      <div className="w-full max-w-5xl bg-zinc-900 border-4 border-zinc-700 rounded-lg shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh]">
        
{/* ESQUERDA: Visor POV e Controles (70% da tela) */}
        <div className="flex-1 flex flex-col border-r-4 border-zinc-700">
          
{/* 1. VISOR POV (Primeira Pessoa) */}
          <div className={`h-3/5 ${getAreaBackground()} relative border-b-4 border-zinc-700 flex items-center justify-center transition-colors duration-1000`}>
{/* Efeito de vinheta escura nas bordas para dar clima de masmorra */}
            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] pointer-events-none"></div>
            
{/* Espaço reservado para a imagem do inimigo/NPC */}
            <div className="z-10 text-center transition-all duration-300">
              
              {/* SE FOR COMBATE */}
              {gameState.currentEvent === 'combat' && gameState.activeEnemy && (
                <div className="flex flex-col items-center animate-pulse">
                  <div className="w-32 h-32 bg-red-950/80 rounded-full border-4 border-red-600 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(220,38,38,0.6)]">
                    <Skull size={64} className="text-red-500" />
                  </div>
                  <h2 className="text-red-500 text-2xl font-bold bg-black/60 px-3 py-1 rounded border border-red-900 uppercase tracking-widest">
                    {gameState.activeEnemy.name}
                  </h2>
                  <div className="w-full mt-2 bg-zinc-950 border border-red-900 rounded overflow-hidden h-4">
                    <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${(gameState.activeEnemy.currentHp / gameState.activeEnemy.maxHp) * 100}%` }}></div>
                  </div>
                </div>
              )}

              {/* SE FOR NPC */}
              {gameState.currentEvent === 'npc' && gameState.activeNpc && (
                <div className="flex flex-col items-center animate-fade-in">
                  <div className="w-32 h-32 bg-blue-950/80 rounded-full border-4 border-blue-600 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                    <MessageCircle size={64} className="text-blue-400" />
                  </div>
                  <h2 className="text-blue-400 text-2xl font-bold bg-black/60 px-3 py-1 rounded border border-blue-900 uppercase tracking-widest">
                    {gameState.activeNpc.name}
                  </h2>
                  
                  {/* Caixa de Diálogo */}
                  <div className="mt-4 p-4 bg-zinc-900/95 border border-zinc-700 rounded-lg max-w-md shadow-xl">
                    <p className="text-zinc-300 italic mb-4">
                      "{gameState.activeNpc.dialogue[quests[gameState.activeNpc.id]]}"
                    </p>
                    
                    {/* Botões da Quest */}
                    <div className="flex justify-center gap-2">
                      {quests[gameState.activeNpc.id] === 'not_started' && (
                        <button 
                          onClick={() => {
                            setQuests(prev => ({ ...prev, [gameState.activeNpc.id]: 'active' }));
                            addLog(`📜 Missão Aceite: Encontrar ${items[gameState.activeNpc.questItem].name}.`);
                          }}
                          className="bg-yellow-700 hover:bg-yellow-600 text-white px-4 py-2 rounded text-xs font-bold uppercase transition-colors"
                        >
                          Aceitar Missão
                        </button>
                      )}

                      {quests[gameState.activeNpc.id] === 'active' && (
                        <button 
                          onClick={() => {
                            const itemIndex = inventory.findIndex(i => i.id === gameState.activeNpc.questItem);
                            if (itemIndex !== -1) {
                              addToInventory(prev => prev.filter((_, idx) => idx !== itemIndex));
                              setQuests(prev => ({ ...prev, [gameState.activeNpc.id]: 'completed' }));
                              addLog(`✅ Missão Concluída! Entregou o item a ${gameState.activeNpc.name}.`);
                              addLog(`🎁 Recompensa: ${gameState.activeNpc.rewardText}`);
                              
                              // --- NOVO: RECOMPENSAS ESPECÍFICAS DOS NPCS ---
                              if (gameState.activeNpc.id === 'kaelen') {
                                // Aumenta a INT e a PRE em +2 permanentemente!
                                setPlayer(prev => ({
                                  ...prev,
                                  attributes: {
                                    ...prev.attributes,
                                    inteligencia: prev.attributes.inteligencia + 2,
                                    presenca: prev.attributes.presenca + 2
                                  }
                                }));
                              }
                              // ----------------------------------------------

                            } else {
                              addLog("❌ Você ainda não tem o item necessário no inventário!");
                            }
                          }}
                          className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded text-xs font-bold uppercase transition-colors"
                        >
                          Entregar Item
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SE ESTIVER VAZIO */}
              {!gameState.currentEvent && (
                <p className="text-zinc-500 text-xl tracking-widest animate-pulse">A sala parece vazia...</p>
              )}
            </div>
            
{/* Nome da Área atual */}
            <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 text-sm text-zinc-400 border border-zinc-700 rounded uppercase tracking-wider">
              {gameState.currentArea.replace('_', ' ')}
            </div>
          </div>

{/* --- MODAL DE LEVEL UP (Aparece se tiver pontos) --- */}
            {player.statPoints > 0 && (
              <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-zinc-900 border-2 border-yellow-600 rounded-lg p-6 w-full max-w-sm shadow-[0_0_30px_rgba(202,138,4,0.3)]">
                  <h2 className="text-2xl font-bold text-yellow-500 mb-1 text-center uppercase tracking-widest">Subiu de Nível!</h2>
                  <p className="text-zinc-400 text-sm mb-6 text-center">
                    Você tem <span className="text-yellow-400 font-bold">{player.statPoints}</span> pontos para distribuir.
                  </p>
                  
                  <div className="space-y-3">
                    {Object.entries(player.attributes).map(([attrName, attrValue]) => {
                      // Verifica se este atributo já atingiu o limite de 2 pontos
                      const isMaxedOut = player.levelAllocations[attrName] >= 2;

                      return (
                        <div key={attrName} className="flex justify-between items-center bg-zinc-950 p-3 rounded border border-zinc-800">
                          <span className="capitalize text-zinc-300 font-bold tracking-wide">{attrName}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-white text-lg">{attrValue}</span>
                            
                            {/* O botão muda de cor e é desativado se atingir o limite */}
                            <button
                              onClick={() => increaseAttribute(attrName)}
                              disabled={isMaxedOut}
                              className={`w-8 h-8 rounded flex items-center justify-center font-bold transition-colors
                                ${isMaxedOut 
                                  ? 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed' 
                                  : 'bg-zinc-800 hover:bg-yellow-900/50 hover:border-yellow-600 text-yellow-500 border border-zinc-600 cursor-pointer'
                                }`}
                              title={isMaxedOut ? "Limite de 2 pontos atingido neste nível" : "Aumentar atributo"}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                </div>
              </div>
            )}

{/* --- MODAL DE INVENTÁRIO --- */}
            {isInventoryOpen && (
              <div className="absolute inset-0 z-[60] bg-black/95 flex flex-col p-6 backdrop-blur-md">
                <div className="flex justify-between items-center border-b border-zinc-700 pb-4 mb-4">
                  <h2 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Backpack className="text-zinc-500" /> Sua Mochila ({inventory.length}/{MAX_INVENTORY_SLOTS})
                  </h2>
                  <button onClick={() => setIsInventoryOpen(false)} className="text-zinc-500 hover:text-white text-2xl">&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                  {inventory.length === 0 && <p className="text-zinc-600 italic text-center mt-10">A mochila está vazia...</p>}
                  
                  {inventory.map((item, index) => {
                    if (!item) return null;

                    const canEquip = checkRequirements(item);

                    return (
                      <div key={index} className="bg-zinc-900 border border-zinc-800 p-3 rounded flex justify-between items-center group">
                        <div>
                          <p className="font-bold text-zinc-200">{item.name}</p>
                          {/* Note os pontos de interrogação no type */}
                          <p className="text-[10px] text-zinc-500 uppercase">{item?.type?.replace('_', ' ')}</p>
                          
                          {!canEquip && item.requirements && (
                            <p className="text-[9px] text-red-400 mt-1 font-bold">
                              REQ: {Object.entries(item.requirements).map(([attr, val]) => `${attr.toUpperCase()} ${val}`).join(' | ')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {/* Note os pontos de interrogação aqui também */}
                          {(item?.type?.startsWith('arma') || item?.type?.startsWith('armadura')) && (
                            <button 
                              onClick={() => equipItem(item)}
                              disabled={!canEquip}
                              className={`text-[10px] px-2 py-1 rounded transition-colors ${
                                canEquip 
                                  ? 'bg-blue-900/30 hover:bg-blue-600 border border-blue-800 text-blue-200' 
                                  : 'bg-red-950/50 border border-red-900 text-red-500 cursor-not-allowed opacity-60'
                              }`}
                            >
                              {canEquip ? 'EQUIPAR' : 'BLOQUEADO'}
                            </button>
                          )}

                          {item?.type?.includes('consumivel') && (
                            <button 
                              onClick={() => {
                                consumeItem(item, index);
                                // Fecha a mochila automaticamente se quiser, ou deixa aberta
                              }}
                              className="text-[10px] bg-green-900/30 hover:bg-green-600 border border-green-800 px-2 py-1 rounded text-green-200 transition-colors"
                            >
                              USAR
                            </button>
                          )}

                          <button 
                            onClick={() => removeFromInventory(index)}
                            className="text-[10px] bg-zinc-800 hover:bg-red-900 border border-zinc-700 px-2 py-1 rounded text-zinc-400 hover:text-white transition-colors"
                          >
                            LARGAR
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-4 bg-zinc-950 border border-zinc-800 rounded">
                  <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Equipamento Atual</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
                      <span className="text-zinc-600 block">ARMA:</span>
                      {/* Note os pontos de interrogação adicionados abaixo! */}
                      <span className="text-white">{player?.equipment?.weapon?.name || 'Nenhuma'}</span>
                    </div>
                    <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
                      <span className="text-zinc-600 block">ARMADURA:</span>
                      {/* Note os pontos de interrogação adicionados abaixo! */}
                      <span className="text-white">{player?.equipment?.armor?.name || 'Nenhuma'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- MODAL DE MAGIA --- */}
            {isMagicOpen && (
              <div className="absolute inset-0 z-[60] bg-blue-950/95 flex flex-col p-6 backdrop-blur-md">
                <div className="flex justify-between items-center border-b border-blue-800 pb-4 mb-4">
                  <h2 className="text-xl font-bold text-blue-200 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="text-blue-500" /> Grimório
                  </h2>
                  <button onClick={() => setIsMagicOpen(false)} className="text-blue-500 hover:text-white text-2xl">&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                  {player.knownSpells.length === 0 && <p className="text-blue-400 italic text-center mt-10">Você não conhece nenhuma magia...</p>}
                  
                  {player.knownSpells.map((spellId) => {
                    const spell = spells[spellId];
                    const canCast = player.currentMp >= spell.mpCost;
                    
                    return (
                      <div key={spellId} className="bg-blue-900/40 border border-blue-800/60 p-3 rounded group relative">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-blue-100 text-lg">{spell.name}</p>
                            <p className="text-xs text-blue-300 font-mono">Custo: {spell.mpCost} MP</p>
                          </div>
                          <button 
                            onClick={() => handleCastSpell(spellId)}
                            disabled={!canCast}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                              canCast 
                                ? 'bg-blue-700 hover:bg-blue-500 text-white cursor-pointer' 
                                : 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed'
                            }`}
                          >
                            CONJURAR
                          </button>
                        </div>
                        <p className="text-xs text-blue-200/70 italic">{spell.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

{/* 2. LOG DE TEXTO E PAINEL DE AÇÕES */}
          <div className="h-2/5 flex flex-col bg-zinc-950">
            {/* Log de Combate/Eventos */}
            <div className="flex-1 p-4 overflow-y-auto text-sm text-zinc-400 space-y-2">
              {gameState.logs.map((log, index) => (
                <p key={index} className="leading-relaxed border-b border-zinc-800 pb-1">
                  <span className="text-zinc-600 mr-2">&gt;</span>{log}
                </p>
              ))}
              <div ref={logEndRef} />
            </div>

{/* Botões de Ação */}
            <div className="p-4 grid grid-cols-4 gap-2 border-t border-zinc-800 bg-zinc-900">
              <button onClick={handleExplore} className="flex flex-col items-center justify-center p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded transition-colors text-xs font-bold uppercase gap-1">
                <Footprints size={18} /> Avançar
              </button>
              <button 
                onClick={handleAttack}
                disabled={gameState.currentEvent !== 'combat'}
                className={`flex flex-col items-center justify-center p-2 border rounded text-xs font-bold uppercase gap-1 transition-colors
                  ${gameState.currentEvent === 'combat' 
                    ? 'bg-red-900/50 hover:bg-red-800/80 border-red-800 text-red-200 cursor-pointer' 
                    : 'bg-zinc-800/50 border-zinc-800 text-zinc-600 cursor-not-allowed'}`}
              >
                <Sword size={18} /> Atacar
              </button>
              <button 
                onClick={() => setIsMagicOpen(true)} 
                className="flex flex-col items-center justify-center p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded transition-colors text-xs font-bold uppercase gap-1"
              >
                <Shield size={18} /> Magia
              </button>
              <button 
                onClick={() => setIsInventoryOpen(true)}
                className="flex flex-col items-center justify-center p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded transition-colors text-xs font-bold uppercase gap-1"
              >
                <Backpack size={18} /> Bolsa
              </button>

              {gameState.currentArea === 'esgotos' && player.level >= 4 && gameState.currentEvent !== 'combat' && (
                <button 
                  onClick={() => {
                    const boss = enemies.vigilante_lodo;
                    setGameState(prev => ({
                      ...prev,
                      currentEvent: 'combat',
                      activeEnemy: { ...boss, currentHp: boss.maxHp }
                    }));
                    addLog(`ATENÇÃO! A água escura treme. O ${boss.name} ergue-se bloqueando a saída!`);
                  }}
                  className="flex flex-col items-center justify-center p-2 bg-purple-900/50 hover:bg-purple-800 border border-purple-600 rounded transition-colors text-xs font-bold uppercase gap-1 text-purple-200 col-span-4"
                >
                  <Skull size={18} /> Desafiar Guardião da Saída
                </button>
              )}
            </div>
          </div>

        </div>

{/* DIREITA: HUD do Jogador (30% da tela) */}
        <div className="w-full md:w-72 bg-zinc-900 p-6 flex flex-col gap-6">
          
{/* Cabeçalho do Personagem */}
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{player.name}</h1>
            <p className="text-sm text-zinc-400">Nível {player.level} • XP: {player.xp} / {xpToNextLevel}</p>
          </div>

{/* Barras de Status */}
          <div className="space-y-4">
{/* HP */}
            <div>
                <div className="flex justify-between text-xs mb-1 font-bold text-red-400">
                  <span>HP (VIG)</span>
                  <span>{player.currentHp} / {maxHp}</span>
                </div>
                <div className="h-3 w-full bg-zinc-950 border border-red-900 rounded overflow-hidden">
                  <div 
                    className="h-full bg-red-600 transition-all duration-300"
                    style={{ width: `${Math.max(0, (player.currentHp / maxHp) * 100)}%` }}
                  ></div>
                </div>
              </div>

{/* MP */}
            {/* MP */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-bold text-blue-400">
                <span>MP (PRE)</span>
                <span>{player.currentMp} / {maxMp}</span>
              </div>
              <div className="h-3 w-full bg-zinc-950 border border-blue-900 rounded overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${Math.max(0, (player.currentMp / maxMp) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

{/* Atributos e CA */}
          <div className="bg-zinc-950 p-4 border border-zinc-800 rounded">
            <h2 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3 border-b border-zinc-800 pb-1">Atributos</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span>Força:</span> <span className="text-white">{player.attributes.forca}</span></li>
              <li className="flex justify-between"><span>Destreza:</span> <span className="text-white">{player.attributes.destreza}</span></li>
              <li className="flex justify-between"><span>Inteligência:</span> <span className="text-white">{player.attributes.inteligencia}</span></li>
              <li className="flex justify-between"><span>Vigor:</span> <span className="text-white">{player.attributes.vigor}</span></li>
              <li className="flex justify-between"><span>Presença:</span> <span className="text-white">{player.attributes.presenca}</span></li>
            </ul>
            
            <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
              <span className="text-sm text-zinc-400">Classe de Armadura</span>
              <span className="text-xl font-bold text-white flex items-center gap-2">
                <Shield size={16} className="text-zinc-500"/> {armorClass}
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default App;