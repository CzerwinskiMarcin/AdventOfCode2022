import {stringToArray} from "../../utils";

type MonkeyMessage = { solved: SolvedEquation, toSolve: Equation[] };
type Equation = [string | number, number | string, string, number | string];
type SolvedEquation = Map<string | number, number>;


export default function (input: string): { first: any, second: any } {
    // console.log = () => {};
    const solution = solve(formatInput(input));

    const secondSolution = solve(formatInput(input), 'humn');
    secondSolution.toSolve.find(([name]) => name === 'root')[2] = '=';
    console.log(secondSolution);
    const missingInput = combineUnsolvedEquations(secondSolution, 'humn');

    return {first: solution.solved.get('root'), second: missingInput};
}

const formatInput = (input: string): MonkeyMessage => {
    const solved: Map<string, number> = new Map<string, number>();
    const toSolve: Equation[] = [] = [];
    const formattedInput = stringToArray(input).map(row => {
        return row
            .replace(':', '')
            .split(' ')
    })
    formattedInput.forEach(eq => eq.length === 2 ? solved.set(eq[0], +eq[1]) : toSolve.push(eq as Equation));
    return {solved, toSolve};
}

const solve = ({solved, toSolve}: MonkeyMessage, unknownInput?: string): MonkeyMessage => {
    let toSolveCopy = [...toSolve];
    let somethingChanged: boolean;

    if (unknownInput) solved.delete(unknownInput);

    do {
        somethingChanged = false;
        let iterationSolvedNames = []
        toSolveCopy = toSolveCopy.map((eq) => {
            let [name, firstPart, sign, secondPart] = eq;
            // console.log(eq);
            // console.log('\tTypeof first part', typeof firstPart);
            if (typeof firstPart === 'string' && solved.has(firstPart)) {
                eq[1] = solved.get(firstPart);
                somethingChanged = true;
                // console.log('\tHas first part solved', name, firstPart);
            }

            // console.log('\tTypeof second part', typeof secondPart);
            if (typeof secondPart === 'string' && solved.has(secondPart)) {
                eq[3] = solved.get(secondPart);
                somethingChanged = true;
                // console.log('\tHas second part solved', name, secondPart);
            }

            // console.log('\tAfter checking parts:', firstPart, secondPart);

            if (Number.isInteger(eq[1]) && Number.isInteger(eq[3])) {
                somethingChanged = eq[2] !== '=';
                // console.log('\tHas all parts')
                let result = solveEquation(eq);

                solved.set(name, result);
                iterationSolvedNames.push(name);
            }

            return eq;
        });

        toSolveCopy = toSolveCopy.filter(([name]) => !iterationSolvedNames.includes(name));
        // console.log(solved, toSolveCopy);
    } while (!solved.has('root') && somethingChanged)

    return {solved, toSolve: toSolveCopy};
}

const solveEquation = (eq: Equation): number => {
    const [name, firstPart, sign, secondPart] = eq;
    let result;
    switch (sign) {
        case '+':
            // console.log('\tDoing addition...');
            result = +firstPart + +secondPart;
            break;
        case '-':
            // console.log('\tDoing substraction...')
            result = +firstPart - +secondPart;
            break;
        case '*':
            // console.log('\tDoing multiplication...')
            result = +firstPart * +secondPart;
            break;
        case '/':
            // console.log('\tDoing divination...');
            result = +firstPart / +secondPart;
            break;
        case '=':
            result = Number(+firstPart === +secondPart);
            break;
    }
    return result;
}

const combineUnsolvedEquations = ({solved, toSolve}: MonkeyMessage, targetPoint: string): any => {
    console.log('To solve', toSolve);
    let startPoint = toSolve.find(([name]) => name === 'root')[1];
    let startValue = toSolve.find(([name]) => name === 'root')[3]

    let iteration = 0
    do {
        console.log('Starting point', startPoint);
        if (startPoint === targetPoint) break;
        solved.set(`${startPoint}`, +startValue);
        const eqIndex = toSolve.findIndex(([name]) => name === startPoint);
        const eq = toSolve[eqIndex];
        toSolve.splice(eqIndex,1);
        console.log('Equation before replacing keys with values', eq);
        eq[0] = solved.get(`${startPoint}`);
        console.log('Equation', eq);
        reverseEq(eq);
        console.log('Reversed equation', eq);
        const result = solveEquation(eq);
        console.log('Result', result)
        startPoint = eq[0];
        startValue = result;
        console.log('New start point', startPoint);
        console.log('New start value', startValue);
        console.log('======================================\n\n');
        iteration++;
    } while (!!toSolve.length);

    return startValue;
}

const reverseEq = (eq: Equation): Equation => {
    let [name, firstPart, sign, secondPart] = eq;
    let tmp;
    let firstPartIsString = false;
    if (typeof firstPart === 'string') {
        firstPartIsString = true;
        tmp = firstPart;
        eq[1] = name;
        eq[0] = tmp;
    } else {
        tmp = secondPart;
        eq[3] = name;
        eq[0] = tmp;
    }


    switch (sign) {
        case '+':
            eq[2] = '-';
            if (!firstPartIsString) {
                tmp = eq[1];
                eq[1] = eq[3];
                eq[3] = tmp;
            }
            break;
        case '-':
            eq[2] = '+';
            tmp = eq[1];
            eq[1] = eq[3];
            eq[3] = tmp;

            if (!firstPartIsString) {
                eq[2] = '-';
                tmp = eq[1];
                eq[1] = eq[3];
                eq[3] = tmp;
            }
            break;
        case '*':
            eq[2] = '/';
            if (!firstPartIsString) {
                tmp = eq[1];
                eq[1] = eq[3];
                eq[3] = tmp;
            }
            break;
        case '/':
            eq[2] = '*';
            break;
    }

    return eq;
}
