import {stringToArray} from "../../utils";

type Position = [number, number]; // x, y
type Direction = [number, number]; // x, y left x < 0, up y > 0
type Movement = {
	direction: Direction; // x, y where values -1 <= i <= 1
	length: number;
}

const DirectionMatrixes = new Map();
DirectionMatrixes.set('L', [-1, 0]);
DirectionMatrixes.set('R', [1, 0]);
DirectionMatrixes.set('U', [0, -1]);
DirectionMatrixes.set('D', [0, 1]);


export default function (input: string): { first: any, second: any } {
	const steps = stringToArray(input);
	const movements = convertRawStepsToMoves(steps);
	const rope = new Rope(1, [0]);
	executeMovements(rope, movements);
	const longRope = new Rope(9, [8]);
	executeMovements(longRope, movements);
	return {first: rope.countUniqueTailPositions(), second: longRope.countUniqueTailPositions()};
}

const convertRawStepsToMoves = (steps: string[]): Movement[] => {
	return steps.map(step => {
		const [direction, length] = step.split(' ');
		return {length: +length, direction: DirectionMatrixes.get(direction)} as Movement;
	});
}

const executeMovements = (rope: Rope, movements: Movement[]): void => {
	movements.forEach((movement, index) => {
		executeMovement(movement, rope)
	});
}

const executeMovement = (movement: Movement, rope: Rope): void => {
	for (let i = 0; i < movement.length; i++) {
		executeStep(movement.direction, rope);
	}
}

const executeStep = (direction: Direction, rope: Rope): void => {
	rope.makeMove(direction);
}

class Rope {
	private headKnotPosition: Position;
	private restKnotsPositions: Position[];
	private restKnotsVisitedPositions: Map<string, number> = new Map(); // Will keep positions in string in format `${x}-${y}

	constructor(restKnotQuantity: number = 1, private trackKnots: number[] = []) {
		this.headKnotPosition = [0, 0];
		this.restKnotsPositions = new Array(restKnotQuantity).fill(undefined).map(() => [0, 0]);
		this.restKnotsVisitedPositions.set('0-0', 1);
	}

	private setHeadKnotPosition = (position: Position): void => {
		this.headKnotPosition = [...position];
	}
	private getHeadKnowPosition = (): Position => this.headKnotPosition;

	countUniqueTailPositions = (): number =>this.restKnotsVisitedPositions.size;

	makeMove = (direction: Direction): void => {
		let currentTarget = this.moveHeadKnot(direction);
		for (let i = 0; i < this.restKnotsPositions.length; i++) {
			const newKnotPosition = this.moveTailKnot(this.restKnotsPositions[i], currentTarget);
			this.restKnotsPositions[i] = [...newKnotPosition];
			currentTarget = [...this.restKnotsPositions[i]];
			if (!this.trackKnots.includes(i)) continue;
			const stringPosition = `${newKnotPosition[0]}-${newKnotPosition[1]}`
			if (this.restKnotsVisitedPositions.has(stringPosition)) {
				this.restKnotsVisitedPositions.set(stringPosition, this.restKnotsVisitedPositions.get(stringPosition) + 1);
			} else {
				this.restKnotsVisitedPositions.set(stringPosition, 1);
			}
		}
	}

	private moveHeadKnot = (direction: Direction): Position => {
		const [x, y] = this.getHeadKnowPosition();
		this.setHeadKnotPosition([x + direction[0], y + direction[1]]);
		return this.getHeadKnowPosition();
	}

	private moveTailKnot = (knotPosition: Position, target: Position): Position | null => {
		if (this.isTailKnotTouchingTarget(knotPosition, target)) {
			return knotPosition;
		}
		const direction = this.determineKnotMovementDirection(knotPosition, target);
		return [knotPosition[0] + direction[0], knotPosition[1] + direction[1]]
	}

	private isTailKnotTouchingTarget = ([knotX, knotY]: Position, [targetX, targetY]: Position): boolean => {
		return Math.abs(targetX - knotX) <= 1 && Math.abs(targetY - knotY) <= 1;
	}

	private determineKnotMovementDirection = (knotPosition: Position, [targetX, targetY]: Position): Direction => {
		const [knotX, knotY] = knotPosition;

		// Same row
		if (targetX === knotX) {
			// Tail is higher
			return targetY - knotY > 0 ? DirectionMatrixes.get('D') : DirectionMatrixes.get('U');
		// Same col
		} else if (targetY === knotY) {
			// Tail at right
			return targetX - knotX > 0 ? DirectionMatrixes.get('R') : DirectionMatrixes.get('L');
		// Diagonal
		} else {
			const xDir = targetX - knotX > 0 ? 1 : -1;
			const yDir = targetY - knotY > 0 ? 1 : -1;
			return [xDir, yDir];
		}
	}
}
