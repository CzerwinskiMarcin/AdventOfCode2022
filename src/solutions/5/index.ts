export default function (input: string): { first: any, second: any } {
    const [rawStacks, rawSteps] = input.split(/\r\n\r/gm);
    const stacks = createStacks(rawStacks);
    const steps = createSteps(rawSteps);
    const movedStacks = executeSteps(stacks, steps, executeStep);
    const topCratesCombined = getTopCratesCombined(movedStacks);
    const moveStacksAdvanced = executeSteps(stacks, steps, executeAdvancedStep)
    const topCratesCombinedAdvanced = getTopCratesCombined(moveStacksAdvanced);
    return {first: topCratesCombined, second: topCratesCombinedAdvanced};
}

interface Step {
    quantity: number;
    from: number;
    to: number;
}

const createStacks = (rawStacks: string): string[][] => {
    const levels = rawStacks.split(/\r/);
    const stacksNumber = getNumberOfStacks(levels[levels.length - 1]);
    return getStacksCrates(levels.slice(0, levels.length - 1), stacksNumber);
}

const getNumberOfStacks = (rawStacks: string): number => {
    return rawStacks
        .replace(/\s*|\n/gm, ',')
        .split(',')
        .filter(sing => !!sing)
        .map(sign => +sign)
        .reduce((acc, curr) => curr > acc ? curr : acc, -Infinity)
}

const getStacksCrates = (rawLevels: string[], stacksNumber: number): string[][] => {
    const formattedStacks = [];
    for (let i = rawLevels.length - 1; i >= 0; i--) {
        const level = rawLevels[i];
        const cleanLevel = level.replace(/\n/g, '')
        for (let i = 0; i < stacksNumber; i++) {
            const crate = cleanLevel.slice(i*4, i*4+4);
            const cleanCrate = crate.replace(/[\[|\]]/gm, '').trim();
            if (!!cleanCrate) {
                if (!formattedStacks[i]) formattedStacks[i] = [];
                formattedStacks[i].push(cleanCrate);
            }
        }
    }
    return formattedStacks;
}

const createSteps = (rawSteps: string): Step[] => {
    return rawSteps
        .split(/\r/gm)
        .map(rawStep => {
            return rawStep.replace(/[a-zA-Z]/gm, '')
                .split(/\s/gm)
                .filter(sign => !!sign)
                .map(sign => +sign)
        })
        .filter(([quantity, ...rest]) => !!quantity)
        .map(([quantity, from, to]) => {
            return {quantity, from, to};
        });
}

const executeSteps = (stacks: string[][], steps: Step[], stepExecutionStrategy: (stacks: string[][], step: Step) => void): string[][] => {
    const copyStacks = stacks.map(stack => [...stack]);
    steps.forEach(step => stepExecutionStrategy(copyStacks, step));
    return copyStacks;
}

const executeStep = (stacks: string[][], step: Step): void => {
    const {quantity, from, to} = step;
    for (let i = 0; i < quantity; i++) {
        stacks[to - 1].push(stacks[from - 1].pop());
    }
}

const executeAdvancedStep = (stacks: string[][], step: Step): void => {
    const {quantity, from, to} = step;
    const cratesToMove = stacks[from - 1].splice(-quantity);
    stacks[to - 1].push(...cratesToMove);
}

const getTopCratesCombined = (stacks: string[][]): string => {
    const copyStacks = stacks.map(stack => [...stack]);
    return copyStacks
        .map(stack => stack.pop())
        .join('');
}