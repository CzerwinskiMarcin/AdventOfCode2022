import * as Wiston from 'winston';

let logger: Wiston.Logger;

export default function (input: string, _logger: Wiston.Logger): { first: any, second: any } {
    logger = _logger;
    let monkeys = MonkeyFactory.convert(input);
    const monkeyManager = new MonkeyManager();
    monkeyManager.getMonkeys(monkeys);
    monkeyManager.observeMonkeys(20);
    const inspectedItems = monkeyManager.getInspectedItemsCount().sort((a, b) => b - a);
    const twoMostActiveSum = inspectedItems.slice(0, 2).reduce((acc, curr) => (acc * curr), 1);

    monkeys = MonkeyFactory.convert(input);
    monkeyManager.getMonkeys(monkeys);
    monkeyManager.observeMonkeys(10000, false);
    const inspectedItemsSecond = monkeyManager.getInspectedItemsCount().sort((a, b) => b - a);
    const twoMostActiveSumSecond = inspectedItemsSecond.slice(0, 2).reduce((acc, curr) => (acc * curr), 1);
	return {first: twoMostActiveSum, second: twoMostActiveSumSecond};
}

const log = (message: any, level: string = 'info'): void => {
    logger.log({
        level,
        message
    });
}

class MonkeyFactory {
    static convert(input: string): Monkey[] {
        log('Converting input:');
        log(input);
        log('\n\n');
        const formattedInput = input.split('\n').map(input => input.replace(/\r/gm, ''));
        const rawData = formattedInput.reduce((acc, curr) => {
            if (!curr) acc.push([]);
            else {
                acc.slice(-1)[0].push(curr);
            }
            return acc;
        }, [[]] as string[][]);

        const data: Monkey[] = rawData.map(data => {
            const id = MonkeyFactory.getId(data);
            const items = MonkeyFactory.getItems(data);
            const operationFn = MonkeyFactory.getItemOperationFn(data);
            const {fn: testFn, division} = MonkeyFactory.getTestFn(data);
            return new Monkey(id, items, operationFn, testFn, division);
        });

        const lcm = data.reduce((acc, {testDivision}: Monkey) => acc * testDivision, 1);
        log(`LCM: ${lcm}`);
        Monkey.LCM = lcm;

        log('To data');
        log(data);
        log('####################################\n\n');

        return data;
    }

    private static getId(data: string[]): number {
        log('Getting id');
        const idString = data.find(d => d.match(/Monkey/));
        if (!idString) {
            log('Cannot find id of monkey from:', 'error');
            log(data, 'error');
            throw new Error(`Cannot find id of monkey from raw data`);
        }
        const id = +idString.replace(/[a-zA-Z:\s]/gm, '');
        log(`\nFound id:`+id);
        return id;
    }

    private static getItems(data: string[]): number[] {
        log('Getting items')
        const items = data.find(d => d.match(/Starting items:/));
        if (!items) throw new Error('Cannot find items of monkey from raw data');
        const formattedItems = items.replace(/[a-zA-z:\s]/gm, '').split(',').map(item => +item);
        log('Found items');
        log(formattedItems);
        return formattedItems;
    }

    private static getItemOperationFn(data: string[]): Function {
        log('Getting operation fn');
        let operation = data.find(d => d.match(/Operation: /));
        if (!operation) throw new Error('Cannot find operation data string from raw data');
        const digits = operation.match(/\d+/g);
        const operationFn = `return ${operation.replace(/.*=\s/gm, '')};`;

        log('Got operation fn: ' + operationFn);
        return new Function('old', operationFn);
    }

    private static getTestFn(data: string[]): {fn: Function, division: number} {
        log('Getting test fn');
        const testDivisibleBy = data.find(d => d.match(/Test: /));
        let trueResult = data.find(d => d.match(/true:/));
        let falseResult = data.find(d => d.match(/false:/));
        if (!testDivisibleBy || !trueResult || !falseResult) throw new Error(`Cannot find operation data string from raw data, ${testDivisibleBy}, ${trueResult}, ${falseResult}`);
        const divisibleBy = testDivisibleBy.replace(/[a-zA-Z\s:]/gm, '');
        trueResult = trueResult.replace(/[a-zA-Z\s:]/gm, '');
        falseResult = falseResult.replace(/[a-zA-Z\s:]/gm, '');
        const testFn = `return itemValue % ${divisibleBy} == 0 ? ${trueResult} : ${falseResult};`;
        log('Got test fn: ' + testFn);
        return {fn: new Function('itemValue', testFn), division: +divisibleBy};
    }
}

class MonkeyManager {
    private monkeys: Monkey[] = [];
    private cachedMonkeys: {[key: number]: Monkey} = {};

    getMonkeys(monkeys: Monkey[]): void {
        log('Got monkeys');
        log(monkeys)
        this.monkeys = [...monkeys.sort(({id}, {id: nextId}) => id - nextId)];
        this.cachedMonkeys = {};
    }

    observeMonkeys(time: number, isWorryLevelDecreasing: boolean = true): void {
        log('OBSERVING MONKEYS');
        for (let i = 0; i < time; i++) {
            log('TURN: ' + i);
            this.monkeys.forEach(monkey => {
                log(monkey);
                const thrownItems = monkey.makeTurn(isWorryLevelDecreasing);
                log('Throw items: ');
                log(thrownItems);
                thrownItems.forEach(({item, targetMonkeyId}) => {
                    log(`Giving item: ${item} to monkey: ${targetMonkeyId}`);
                    this.getGivenMonkey(targetMonkeyId)
                        .receiveItem(item)
                })

                this.monkeys.forEach(monkey => {
                    log(`Monkey id: ${monkey.id} current items: `);
                    log(monkey.getItems());
                });
            });
            log('END TURN');
        }

        this.monkeys.forEach(monkey => monkey.showQuantityOfInspectedItems());
    }

    getInspectedItemsCount(): number[] {
        return this.monkeys.map(monkey => monkey.getNumberOfInspectedItems());
    }

    private getGivenMonkey(id: number): Monkey {
        if (this.cachedMonkeys[id]) return this.cachedMonkeys[id];
        const monkey = this.monkeys.find(monkey => monkey.id === id);
        if (!monkey) throw new Error(`There is no monkey with id: ${id}`);
        this.cachedMonkeys[id] = monkey;
        return monkey;
    }
}

class Monkey {
    static LCM: number;
    private inspectedItems: number;
    constructor(readonly id: number, private items: number[], private operationFn: Function, private testFn: Function, public testDivision: number) {
        this.inspectedItems = 0;
    }

    showQuantityOfInspectedItems(): void {
        log(`Monkey: ${this.id} inspected items ${this.inspectedItems}`);
    }

    getNumberOfInspectedItems(): number {
        return this.inspectedItems;
    }

    getItems(): number[] {
        return this.items;
    }

    receiveItem(item: number): void {
        log(`Monkey id: ${this.id} received item: ${item}`);
        this.items.push(item);
    }

    makeTurn(isWorryLevelDecreasing: boolean = true): {item: number, targetMonkeyId: number}[] {
log(`Monkey id: ${this.id} turn`);
        const thrownItems: {item: number, targetMonkeyId: number}[] = [];
        while (!!this.items.length) {
            const item = this.getFirstItem();
            log(`Inspecting item: ${item}`);
            let operatedItem = this.operationFn(item);
            log(`Item after operation: ${operatedItem}`);
            log(`Should decrease worry level: ${isWorryLevelDecreasing}`);
            if (isWorryLevelDecreasing) {
                operatedItem = Math.floor(operatedItem / 3);
                log(`Item after worry level decreasing ${operatedItem}`);
            } else {
                operatedItem %= Monkey.LCM;
            }
            const targetMonkeyId = this.testFn(operatedItem);
            log(`Item ${operatedItem} goes to monkey: ${targetMonkeyId}`);
            thrownItems.push({item: operatedItem, targetMonkeyId});
            this.inspectedItems++;
            log(`Number of inspected items: ${this.inspectedItems}`);
            log(`=========================`)
        }
        log('');
        return thrownItems;
    }

    private getFirstItem(): number {
        return this.items.shift();
    }
}
