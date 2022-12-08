import {stringToArray} from "../../utils";

type TreeMap = number[][];
type TreePosition = [number, number]; // [x, y] position

export default function (input: string): { first: any, second: any } {
    const treeMap = processTreeMap(input);
    const numberOfTrees = countTrees(treeMap);
    const hiddenTrees = findHiddenTrees(treeMap);
    const visibleTrees = numberOfTrees - hiddenTrees.length;
    const maxSceneScore = findHighestScenicScore(treeMap);
	return {first: visibleTrees, second: maxSceneScore};
}

const processTreeMap = (input: string): TreeMap => {
    const treeRows = stringToArray(input);
    const treeMap: number[][] = new Array(treeRows.length);

    treeRows.forEach((row, x) => {
        treeMap[x] = [];
        row.split('').forEach((treeHeight: string) => treeMap[x].push(+treeHeight));
    });

    return treeMap;
}

const findHiddenTrees = (treeMap: TreeMap): TreePosition[] => {
    const hiddenTreeCoordinates: TreePosition[] = [];

    let [x, y] = [1, 0];
    do {
        y++

        if (isHidden([x, y], treeMap)) {
            hiddenTreeCoordinates.push([x,y]);
        }
        // We want to check inner trees not from perimeter
        if (y === treeMap.length - 2) {
            y = 0;
            x++;
        }
    } while(x <= treeMap.length - 2);

    return hiddenTreeCoordinates;
}

const findHighestScenicScore = (map: TreeMap): number => {
    let maxScore = -Infinity;

    let [x, y] = [1, 0];
    do {
        y++

        const currentScore = calculateScenicScore([x, y], map);

        if (currentScore > maxScore) maxScore = currentScore;

        // We want to check inner trees not from perimeter
        if (y === map.length - 2) {
            y = 0;
            x++;
        }
    } while(x <= map.length - 2);

    return maxScore;
}

const calculateScenicScore = ([x, y]: TreePosition, map: TreeMap): number => {
    const targetHeight = map[x][y];
    const {left, right, top, bottom} = getSeparatedTreeLines([x, y], map);
    left.reverse();
    top.reverse();
    const compareFn = height => height < targetHeight;
    const visibleLeft = getUntil<number>(left, compareFn);
    const visibleRight = getUntil<number>(right, compareFn);
    const visibleTop = getUntil<number>(top, compareFn);
    const visibleBottom = getUntil<number>(bottom, compareFn);
    return visibleLeft.length * visibleRight.length * visibleTop.length * visibleBottom.length;
}

const getUntil = <T>(arr: T[], compareFn: (item: T) => boolean): T[] => {
    const result: T[] = [];
    for (let i = 0; i < arr.length; i++) {
        result.push(arr[i]);

        if(!compareFn(arr[i])) break;
    }
    return result;
}

const isHidden = ([x, y]: TreePosition, map: TreeMap): boolean => {
    const targetHeight = map[x][y];
    const {left, right, top, bottom} = getSeparatedTreeLines([x, y], map);
    const isHiddenHorizontally = Math.max(...left) >= targetHeight && Math.max(...right) >= targetHeight;
    const isHiddenVertically = Math.max(...top) >= targetHeight && Math.max(...bottom) >= targetHeight;
    return isHiddenHorizontally && isHiddenVertically;
}

const getSeparatedTreeLines = ([x, y]: TreePosition, map: TreeMap): {left: number[], right: number[], top: number[], bottom: number[]} => {
    const row = [...map[x]];
    const col = [...map.map(row => row[y]).reduce((acc, curr) => {acc.push(curr); return acc}, [])];
    const left = row.splice(0, y);
    row.shift();
    const top = col.splice(0, x);
    col.shift();
    return {left, right: row, top, bottom: col};
}

const countTrees = (map: TreeMap): number => {
    const rowNumber = map.length;
    const treesInRow = map[0].length;
    return rowNumber * treesInRow;
}