import {stringToArray} from "../../utils";

type NumberObject = {
	value: number;
}

const DECRYPTION_KEY = 811589153;
const DECRYPTION_POSITIONS = [1000, 2000, 3000];

export default function (input: string): { first: any, second: any } {
	const queue = parseInput(input);
	const mixedQueue = applyQueueMixing(queue, [...queue]);
	const numbers = getNumbersAtPositions(mixedQueue, DECRYPTION_POSITIONS);
	const sum = numbers.reduce((acc, curr) => acc + curr, 0);

	// Second part
    const multipliedQueue = queue.map(({value}) => ({value: value * DECRYPTION_KEY}));
    let decryptedMixedQueue = [...multipliedQueue];
    for (let i = 0; i < 10; i++) {
        decryptedMixedQueue = applyQueueMixing(multipliedQueue, decryptedMixedQueue);
    }
    const decryptedNumbers = getNumbersAtPositions(decryptedMixedQueue, DECRYPTION_POSITIONS)
    const decryptedSum = decryptedNumbers.reduce((acc, curr) => acc + curr, 0);
	return {first: sum, second: decryptedSum};
}

const parseInput = (input: string): NumberObject[] => {
    return stringToArray(input)
        .filter(v => v !== '')
        .map(v => ({value: +v}));
}

const applyQueueMixing = (originalQueue: NumberObject[], queue: NumberObject[]): NumberObject[] => {
    originalQueue.forEach(item => {
        const index = queue.findIndex(i => i === item);
        let diff = item.value % (queue.length - 1);
        diff = index + diff;
        while (diff > queue.length - 1) {
            diff = diff % (queue.length - 1)
        }

        if (diff === 0 && item.value < 0) {
            diff = queue.length - 1;
        }
        queue.splice(index, 1);
        queue.splice(diff, 0, item);
    });
    return queue;
}

const getNumbersAtPositions = (queue: NumberObject[], positions: number[]): number[] => {
    const zeroIndex = queue.findIndex(({value}) => value == 0);
    const diff = queue.length - zeroIndex;
    return positions.map(position => {
        const pos = position % queue.length;
        const offset = diff;
        const index = pos - offset;
        const foundValue = queue.slice(index)[0].value;
        return foundValue;
    });
}
