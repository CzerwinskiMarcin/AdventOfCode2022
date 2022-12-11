import {stringToArray} from "../../utils";

export default function (input: string): { first: any, second: any } {
	const instructions = stringToArray(input)
    const markCycles = [20, 60, 100, 140, 180, 220];
	const register = new Register(220)
	register.loadInstructions(instructions);
	const markedCyclesValues = register.execute(markCycles);
	const crtRegister = new Register(240);
	const crt = new CRT(40, 6);
	crtRegister.notify(crt);
	crtRegister.loadInstructions(instructions);
	crtRegister.execute();
	crt.renderScreen();
	return {first: calculateSumOfSignalStrengths(markCycles, markedCyclesValues), second: null};
}

const calculateSumOfSignalStrengths = (cycles: number[], registerValuesAtCycles: number[]): number => {
    let sum = 0;
    for (let i = 0; i < cycles.length; i++) {
    	sum += (cycles[i] * registerValuesAtCycles[i]);
	}
    return sum;
}

interface ClockSync {
	handleCycleStart(...argv: any): void;
}

class Register {
	private x: number;
	private cycle: number;
	private markedCycles: number[];
	private instructions: string[];
	private queue: number[] = [];
	private notifyTargets: Set<ClockSync> = new Set();
	private cyclesToRun: number;

	constructor(cycles: number) {
		this.x = 1;
		this.cycle = 1;
		this.cyclesToRun = cycles;
	}

	notify(target: ClockSync): void {
		this.notifyTargets.add(target);
	}

	loadInstructions(instructions: string[]): void {
	    this.instructions = [...instructions];
	}

	execute(markedCycles: number[] = []): number[] {
		this.markedCycles = markedCycles.sort((a, b) => a - b);
		const savedRegisterValues = [];
	    if (!this.instructions.length) throw new Error('No Instructions');
	    do {
	    	if (!this.queue.length) this.bufferInstructions(10);
	    	this.executeCycle();
	    	if (this.markedCycles.includes(this.cycle)) savedRegisterValues.push(this.x);

		} while ((!!this.instructions.length || !!this.queue.length) && this.cyclesToRun >= this.cycle);

	    return savedRegisterValues;
	}

	private bufferInstructions(bufferSize): void {
	    const instructions = this.instructions.splice(0, bufferSize);
	    instructions.forEach(instruction => this.bufferInstruction(instruction));
	}

	private bufferInstruction(instruction: string): void {
		const [command, value] = this.convertInstruction(instruction);
		switch (command) {
			case Instruction.AddX:
			    this.queue.push(...[0, value]);
				break;
			case Instruction.Noop:
			    this.queue.push(0);
				break;
		}
	}

	private executeCycle(): void {
	    this.notifyTargets.forEach(target => target.handleCycleStart(this.x));
	    this.x += this.queue.shift();
	    this.cycle++;
	}

	private convertInstruction(instruction: string): ConvertedInstruction {
		const [command, value = 0] = instruction.split(' ');
		return [command, +value];
	}
}

class CRT implements ClockSync {
    private frame: string;
    private pixelIndex: number;
    private screenResolution: {width: number, height: number};

    constructor(width: number, height: number) {
    	this.frame = '';
    	this.pixelIndex = 0;
    	this.screenResolution = {width, height};
	}

	renderScreen(): void {
    	const rowRegexp = new RegExp(`.{1,${this.screenResolution.width}}`, 'g');
		const screen = this.frame.match(rowRegexp).join('\n');
		console.log(screen);
	}

	handleCycleStart(registerValue: number): void {
        const pixelState = Math.abs(this.pixelIndex % this.screenResolution.width - registerValue) <= 1 ? '#' : '.';
        this.frame += pixelState;
        this.pixelIndex++;
	}

}

type ConvertedInstruction = [string, number];

enum Instruction {
	AddX = 'addx',
	Noop = 'noop'
}