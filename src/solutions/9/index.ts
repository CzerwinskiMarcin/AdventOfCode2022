import {stringToArray} from "../../utils";

class Rope {
	private headPosition: Position[] = [[0, 0]];
	private tailPosition: Position[] = [[0, 0]];

	private setHeadPosition = (position: Position): void => {
		this.headPosition.push(position);
	}

	private setTailPosition = (position: Position): void => {
		this.tailPosition.push(position);
	}

	private wasTailInPosition = (position: Position): boolean => {
		return this.tailPosition.some(([x, y] ) => x === position[0] && y === position[1]);
	}

	private tailOrderInPosition = (position: Position): number => {
		return this.tailPosition.findIndex(([x, y] ) => x === position[0] && y === position[1]) + 1;
	}

	private getHeadPosition = (): Position => this.headPosition[this.headPosition.length-1];
	private getTailPosition = (): Position => this.tailPosition[this.tailPosition.length-1];

	countUniqueTailPositions = (): number => {
		const positionStrings = this.tailPosition
			.map(([x, y]) => `${x}-${y}`)
        return new Set(positionStrings).size
	}

	showTailPath = () => this.showPath(this.tailPosition);
	showHeadPath = () => this.showPath(this.headPosition);


	showPath = (positions: Position[]): void => {
	    const [[xMin, xMax], [yMin, yMax]] = this.determineMapWidthHeight(positions);
	    const width = Math.abs(xMin) + Math.abs(xMax) + 1;
		const height = Math.abs(yMin) + Math.abs(yMax) + 1;

		let map = '';
		for (let h = 0; h < height; h++) {
		    let row = '';
			for (let w = 0; w < width; w++) {
				row += this.wasTailInPosition([w, h]) ? '# ' : '. ';
				// const order = this.tailOrderInPosition([w, h]);
				// row += (order > 0 ? `  ${order}  ` : '  .  ').substring(0, 4);
			}
			map += row;
			map += '\n';
		}
	}

	private determineMapWidthHeight = (positions: Position[]): [[number, number], [number, number]] => {
	    const separatePositions = this.tailPosition.reduce((acc, curr) => {
	    	acc[0].push(curr[0]);
			acc[1].push(curr[1]);
			return acc;
		}, [[], []])

		return [
			[Math.min(...separatePositions[0]), Math.max(...separatePositions[0])],
			[Math.min(...separatePositions[1]), Math.max(...separatePositions[0])]
		]
	}

	makeMove = (direction: Direction): void => {
		this.moveHead(direction);
		this.moveTail();
	}

	private moveHead = (direction: Direction): void => {
		const [x, y] = this.getHeadPosition();
		this.setHeadPosition([x + direction[0], y + direction[1]]);
		// console.log('Moving head from', [x, y], 'to', this.getHeadPosition());
	}

	private moveTail = (): void => {
	    if (this.isTailTouchingHead()) {
	    	// console.log('Not moving tail from', this.getTailPosition());
	    	return;
		}
	    const direction = this.determineTailMovementDirection();
	    const [tailX, tailY] = this.getTailPosition();
	    this.setTailPosition([tailX + direction[0], tailY + direction[1]]);
	    // console.log('Moving tail from', [tailX, tailY], 'to',  this.getTailPosition());
	}

	private isTailTouchingHead = (): boolean => {
		const [headX, headY] = this.getHeadPosition();
		const [tailX, tailY] = this.getTailPosition();
		return Math.abs(headX - tailX) <= 1 && Math.abs(headY - tailY) <= 1;
	}

	private determineTailMovementDirection = (): Direction => {
		const [headX, headY] = this.getHeadPosition();
		const [tailX, tailY] = this.getTailPosition();

		// Same row
		if (headX === tailX) {
			// Tail is higher
			return headY - tailY > 0 ? DirectionMatrixes.get('D') : DirectionMatrixes.get('U');
		// Same col
		} else if (headY === tailY) {
			// Tail at right
			return headX - tailX > 0 ? DirectionMatrixes.get('R') : DirectionMatrixes.get('L');
		// Diagonal
		} else {
			const xDir = headX - tailX > 0 ? 1 : -1;
			const yDir = headY - tailY > 0 ? 1 : -1;
			return [xDir, yDir];
		}
	}
}

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
	const rope = executeMovements(movements);
	rope.showTailPath();
	return {first: rope.countUniqueTailPositions(), second: null};
}

const convertRawStepsToMoves = (steps: string[]): Movement[] => {
    return steps.map(step => {
    	const [direction, length] = step.split(' ');
    	return {length: +length, direction: DirectionMatrixes.get(direction)} as Movement;
	});
}

const executeMovements = (movements: Movement[]): Rope => {
	const rope: Rope = new Rope();
	movements.forEach(movement => executeMovement(movement, rope));
	return rope;
}

const executeMovement = (movement: Movement, rope: Rope): void => {
    // console.log('Executing movement:', movement);
	for (let i = 0; i < movement.length; i++) {
	    executeStep(movement.direction, rope);
	}
	// console.log();
}

const executeStep = (direction: Direction, rope: Rope): void => {
    rope.makeMove(direction);
}
