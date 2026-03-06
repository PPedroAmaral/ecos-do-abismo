export const rollDice = (sides) => {
    return Math.floor(Math.random() * sides) + 1
}

export const rollDamage = (damageString) => {
    if (!damageString) return 0

    const [dicePart, bonusPart] = damageString.split('+')
    const [amount, sides] = dicePart.split('d').map(Number)
    const bonus = bonusPart ? Number(bonusPart) : 0

    let total = 0
    for (let i = 0; i < amount; i++) {
        total += rollDice(sides)
    }
    return total + bonus
}