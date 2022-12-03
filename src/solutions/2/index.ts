export default function(input: string): {first: any, second: any} {
    // First part of puzzle
    const gameRounds = prepareGameRounds(input);
    const roundsOutcomes = getRoundsOutcomes(gameRounds);
    const shapeScore = getShapesScore(gameRounds);

    // Second part of puzzle;
    const gameRoundsBasedOnExpectedResult = prepareGameRoundsBasedOnExpectedResult(input)
    const secondRoundsOutcomes = getRoundsOutcomes(gameRoundsBasedOnExpectedResult);
    const secondShapeScore = getShapesScore(gameRoundsBasedOnExpectedResult);
    return {first: roundsOutcomes + shapeScore, second: secondRoundsOutcomes + secondShapeScore};
}

enum CommonShape {
    ROCK = 1,
    PAPER = 2,
    SCISSOR = 3
}

enum EnemyShape {
    A = CommonShape.ROCK,
    B = CommonShape.PAPER,
    C = CommonShape.SCISSOR
}

enum MyShape {
    X = CommonShape.ROCK,
    Y = CommonShape.PAPER,
    Z = CommonShape.SCISSOR
}

enum RoundPointOutcome {
    WIN = 6,
    DRAW = 3,
    LOSE = 0
}

enum ExpectedResult {
    X = RoundPointOutcome.WIN,
    Y = RoundPointOutcome.DRAW,
    Z = RoundPointOutcome.LOSE
}

const ShapeClashResult = {
    [CommonShape.ROCK]: {
        [CommonShape.SCISSOR]: RoundPointOutcome.WIN,
        [CommonShape.ROCK]: RoundPointOutcome.DRAW,
        [CommonShape.PAPER]: RoundPointOutcome.LOSE
    },
    [CommonShape.PAPER]: {
        [CommonShape.ROCK]: RoundPointOutcome.WIN,
        [CommonShape.PAPER]: RoundPointOutcome.DRAW,
        [CommonShape.SCISSOR]: RoundPointOutcome.LOSE
    },
    [CommonShape.SCISSOR]: {
        [CommonShape.PAPER]: RoundPointOutcome.WIN,
        [CommonShape.SCISSOR]: RoundPointOutcome.DRAW,
        [CommonShape.ROCK]: RoundPointOutcome.LOSE
    }
}

const getShapesScore = (rounds: [CommonShape, CommonShape][]): number => {
    return rounds
        .map(([enemyShape, myShape]) => myShape)
        .reduce((acc: number, curr: number): number => acc + curr, 0);
}

const getRoundsOutcomes = (rounds: [CommonShape, CommonShape][]): number => {
    return rounds
        .map(([enemyShape, myShape]) => getRoundResult(myShape)(enemyShape))
        .reduce((acc: number, curr: number): number => acc + curr, 0);
}

const getRoundResult = (firstShape: CommonShape) => (replyShape: CommonShape): number => {
    return ShapeClashResult[firstShape][replyShape];
}

const prepareGameRounds = (strategyGuide: string): [CommonShape, CommonShape][] => {
    const turns = strategyGuide.replace(/\r/gm, '').split('\n');
    return turns.map(turn => {
        const [enemyShape, myShape] = turn.split(' ');
        return [EnemyShape[enemyShape], MyShape[myShape]];
    });
}

const prepareGameRoundsBasedOnExpectedResult = (strategyGuide: string): [CommonShape, CommonShape][] => {
    const turns = strategyGuide.replace(/\r/gm, '').split('\n');
    return turns.map(turn => {
        const [enemyShapeSign, expectedResultSign] = turn.split(' ');
        const enemyShape = EnemyShape[enemyShapeSign];
        const currentShapeClash = ShapeClashResult[enemyShape];
        const expectedResult = ExpectedResult[expectedResultSign];
        const [key] = Object.entries(currentShapeClash).find(([key, value]) => value === expectedResult);
        return [enemyShape, +key as unknown as CommonShape];
    });
};

