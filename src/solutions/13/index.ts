import {stringToArray} from "../../utils";

export default function (input: string): { first: any, second: any } {
    const formattedInput = stringToArray(input).reduce((acc, curr) => {
        if (curr === '') acc.push([]);
        else acc.slice(-1)[0].push(JSON.parse(curr));
        return acc;
    }, [[]] as number[][]);
    console.log()

    const packetOrders = formattedInput.map((packet, index) => {
        console.log('PACKAGE NUMBER:', index)
        const result = isPacketInRightOrder(packet)
        console.log('\n========================================\n');
        return result;
    });
    console.log('Packet order results:', packetOrders);

    const sum = packetOrders.reduce((acc, curr, index) => {
        if (curr === OrderType.RIGHT) {
            acc += ++index;
        }
        return acc;
    }, 0)

	return {first: sum, second: null};
}

enum OrderType {
    NOT_RESOLVED = 'NOT_RESOLVED',
    RIGHT = 'OK',
    WRONG = 'WRONG'
}

const isPacketInRightOrder = (packet: any): OrderType => {
    const [left, right] = packet;
    let orderType = OrderType.NOT_RESOLVED;
    let i = 0;

    if (!!left.length && !right.length) {
        return OrderType.WRONG;
    }

    while (orderType === OrderType.NOT_RESOLVED && !!left.length) {
        const l = left.shift();
        const r = right.shift();

        console.log('Iteration:', i);
        if (l instanceof Array && r instanceof Array) {
            console.log(`Both L and R are array`, l, r);
            orderType = isPacketInRightOrder([l, r]);
        } else if (l instanceof Array || r instanceof Array) {
            console.log(`One of L and R is array`, l, r);
            let newL = l;
            let newR = r;
            if (l instanceof Array) newR = [r];
            else newL = [l];
            console.log(`Converted to arrays`, newL, newR);
            orderType = isPacketInRightOrder([newL, newR]);
        } else if (l === r) {
            console.log(`Same values: ${l} === ${r}`);
            orderType = OrderType.NOT_RESOLVED
        } else {
            console.log(`Different values: ${l} <=> ${r}. Result: ${l < r ? OrderType.RIGHT : OrderType.WRONG}`);
            orderType = l < r ? OrderType.RIGHT : OrderType.WRONG;
        }
    }

    if (!left.length && !!right.length && orderType === OrderType.NOT_RESOLVED) {
        console.log('Left array ended while right not', left, right);
        orderType = OrderType.RIGHT;
    }
    return orderType;
}