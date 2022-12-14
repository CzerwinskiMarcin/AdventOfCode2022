import {stringToArray} from "../../utils";

export default function (input: string): { first: any, second: any } {
    let formattedInput = getPackages(input);
    const result: OrderType[] = [];
    for (let i = 0; i < formattedInput.length; i += 2) {
        // console.log('PACKAGE NUMBER:', i/2);
        result.push(isPacketInRightOrder([formattedInput[i], formattedInput[i+1]]));
        // console.log('\n========================================\n');
    }

    const sum = result.reduce((acc, curr, index) => {
        if (curr === OrderType.RIGHT) {
            acc += ++index;
        }
        return acc;
    }, 0)

    console.log('\n========================================\n');
    console.log(isPacketInRightOrder([[[2], [[8], []], []], [[2, [2,4]],[]]]));

    formattedInput = [...getPackages(input), [[2]], [[6]]];
    let sortedPackage = [];
    let iteration = 0;

    while (!!formattedInput.length) {
        console.log('Iteration:', iteration);
        const toSort = formattedInput.pop();
        sortedPackage.push(toSort);
        console.log('To sort:', JSON.stringify(toSort));
        sortedPackage = sortPackages(sortedPackage);
        const sortIndex = sortedPackage.findIndex(pack => JSON.stringify(pack) === JSON.stringify(toSort));
        console.log(sortedPackage.slice(sortIndex - 1, sortIndex + 2).map(pack => JSON.stringify(pack)));
        console.log('===========================\n');
        iteration++;
    }
    const dividedPacket2 = sortedPackage.findIndex(pack => JSON.stringify(pack) === JSON.stringify([[2]])) + 1;
    const dividedPacket6 = sortedPackage.findIndex(pack => JSON.stringify(pack) === JSON.stringify([[6]])) + 1;
	return {first: sum, second: dividedPacket6 * dividedPacket2};
}

enum OrderType {
    NOT_RESOLVED = 'NOT_RESOLVED',
    RIGHT = 'OK',
    WRONG = 'WRONG'
}

const isPacketInRightOrder = (packet: any): OrderType => {
    const left = [...packet[0]];
    const right = [...packet[1]];
    let orderType = OrderType.NOT_RESOLVED;
    let i = 0;

    while (orderType === OrderType.NOT_RESOLVED && !!left.length && right.length) {
        const l = left.shift();
        const r = right.shift();

        // console.log('\nIteration:', i);
        // console.log('Comparing:', l, 'and', r);
        if (l instanceof Array && r instanceof Array) {
            // console.log(`Both L and R are array`, l, r);
            orderType = isPacketInRightOrder([l, r]);
        } else if (l instanceof Array || r instanceof Array) {
            // console.log(`One of L and R is array`, l, r);
            let newL = l;
            let newR = r;
            if (l instanceof Array) newR = [r];
            else newL = [l];
            // console.log(`Converted to arrays`, newL, newR);
            orderType = isPacketInRightOrder([newL, newR]);
        } else if (l !== r) {
            // console.log(`Different values: ${l} <=> ${r}. Result: ${l < r ? OrderType.RIGHT : OrderType.WRONG}`);
            orderType = l < r ? OrderType.RIGHT : OrderType.WRONG;
        }

        i++;
    }

    if (!right.length && !!left.length && orderType === OrderType.NOT_RESOLVED) {
        // console.log(`Right order finished first. Left: ${left.length}, right: ${right.length}`);
        return OrderType.WRONG;
    } else if (!left.length && !!right.length && orderType === OrderType.NOT_RESOLVED) {
        // console.log(`Left order finished first. Left: ${left.length}, right: ${right.length}`);
        return OrderType.RIGHT;
    }

    return orderType;
}

const getPackages = (input: string): any[] => {
    return stringToArray(input).reduce((acc, curr) => {
        if (curr !== '') acc.push(JSON.parse(curr));
        return acc;
    }, [] as any[]);
}

const sortPackages = (packages: any[]): any[] => {
    let sortedPackages = [...packages];
    let areAllInOrder = false
    let iteration = 0;
    let swappedPackages = 0;

    while (!areAllInOrder) {
        areAllInOrder = true;
        swappedPackages = 0;
        for (let i = 0; i < sortedPackages.length - 1; i ++) {
            const isRight = isPacketInRightOrder([sortedPackages[i], sortedPackages[i+1]]) === OrderType.RIGHT;
            if (!isRight) {
                const temp = sortedPackages[i + 1];
                sortedPackages[i + 1] = sortedPackages[i];
                sortedPackages[i] = temp;
                areAllInOrder = false;
                swappedPackages++;
            }
        }
        iteration++;
    }

    return sortedPackages;
}