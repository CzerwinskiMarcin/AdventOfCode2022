export default function(input: string): {first: any, second: any} {
    const snacks = input.replace(/\r/gm, '').split('\n');

    let elfsSnacks = [[]];
    for (let i = 0; i < snacks.length; i++) {
        const snack = snacks[i];
        if (!snack) elfsSnacks.push([]);
        else elfsSnacks[elfsSnacks.length - 1].push(snack);
    }

    const totalCaloriesPerElf = [];
    elfsSnacks.forEach(snacks => {
        const snacksSum = snacks.reduce((acc, curr) => acc + +curr, 0);
        totalCaloriesPerElf.push(snacksSum);
    })

    totalCaloriesPerElf.sort((prev, next) => next - prev);

    const first = Math.max(...totalCaloriesPerElf);
    const second = totalCaloriesPerElf.slice(0, 3).reduce((acc, curr) => acc + curr, 0);
    return {first, second};
}